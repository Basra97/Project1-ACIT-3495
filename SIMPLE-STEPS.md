# Azure Kubernetes Deployment - Simple Commands

Follow these commands in order. Copy and paste each one.

## Step 1: Login to Azure
```bash
az login

az login --use-device-code
```

## Step 2: Create Resource Group
```bash
az group create --name video-streaming-rg --location westus
```

## Step 3: Register Azure Providers (First Time Only)
```bash
# Register required providers (takes 1-2 minutes)
az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.ContainerService

# Check registration status (wait until "Registered")
az provider show --namespace Microsoft.ContainerRegistry --query "registrationState"
```

## Step 4: Create Container Registry (ACR)
```bash
# Use a unique name - add your name or random numbers
az acr create --resource-group video-streaming-rg --name videostreamingacr --sku Basic --admin-enabled true

az acr login --name videostreamingacr
```

## Step 5: Build Docker Images
```bash
# Build each service
docker build -t videostreamingacr.azurecr.io/auth-service:latest ./authentication-service
docker build -t videostreamingacr.azurecr.io/catalog-service:latest ./catalog-service
docker build -t videostreamingacr.azurecr.io/file-service:latest ./file-system-service
docker build -t videostreamingacr.azurecr.io/web:latest ./video-streaming-web
```

## Step 6: Push Images to Azure
```bash
docker push videostreamingacr.azurecr.io/auth-service:latest
docker push videostreamingacr.azurecr.io/catalog-service:latest
docker push videostreamingacr.azurecr.io/file-service:latest
docker push videostreamingacr.azurecr.io/web:latest
```

## Step 7: Update YAML Files
ALREADY DONE - YAML files updated with `videostreamingacr`

(If you used a different ACR name, edit these files manually:
- `k8s/auth-service.yaml`
- `k8s/catalog-service.yaml`
- `k8s/file-service.yaml`
- `k8s/web.yaml`)

## Step 8: Create Kubernetes Cluster
```bash
az aks create \
  --resource-group video-streaming-rg \
  --name video-aks \
  --node-count 2 \
  --node-vm-size Standard_B2s \
  --generate-ssh-keys \
  --attach-acr videostreamingacr
```
⏱️ This takes 5-10 minutes

## Step 9: Connect to Cluster
```bash
az aks get-credentials --resource-group video-streaming-rg --name video-aks

kubectl get nodes
```

## Step 10: Install Metrics Server
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

## Step 11: Deploy Application
```bash
kubectl apply -f k8s/
```

## Step 12: Check Status
```bash
# See all pods
kubectl get pods -n video-streaming

# See services (wait for EXTERNAL-IP)
kubectl get svc -n video-streaming

# See autoscaling
kubectl get hpa -n video-streaming
```

## Step 13: Test Horizontal Pod Autoscaling

### A. Check Initial State (Take Screenshot #1)
```bash
# Show initial pods (should be 2 replicas per service)
kubectl get pods -n video-streaming

# Show HPA current status
kubectl get hpa -n video-streaming
```

### B. Fix MySQL Table (If Not Already Done)
```bash
# Create the videos table in MySQL
kubectl exec -n video-streaming $(kubectl get pods -n video-streaming -o name | grep mysql) -- mysql -uroot -pexample data_db -e "CREATE TABLE IF NOT EXISTS videos (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, path VARCHAR(1024) NOT NULL, thumb VARCHAR(1024) NULL, uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"
```

### C. Test Application Works
```bash
# Get service IPs
kubectl get svc -n video-streaming

# Test auth service (replace with your actual IP)
curl -X POST http://EXTERNAL-IP:4000/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'

# Open web interface in browser: http://WEB-EXTERNAL-IP
# Login with: admin / admin123
```

### D. Generate Load (Terminal 1)
```bash
# Get auth service IP first
kubectl get svc auth-service -n video-streaming

# Generate continuous load (replace EXTERNAL-IP with actual IP)
while true; do curl -X POST http://EXTERNAL-IP:4000/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' > /dev/null 2>&1; done
```

### E. Watch HPA (Terminal 2 - Take Screenshot #2)
```bash
# Watch CPU utilization increase and replicas scale up
kubectl get hpa -n video-streaming --watch
```

### F. Watch Pods (Terminal 3 - Take Screenshot #3)
```bash
# See new pods being created (auth-service will scale from 2 to 3-10)
kubectl get pods -n video-streaming --watch
```

### G. Stop Load and Watch Scale Down
```bash
# Press Ctrl+C in Terminal 1 to stop the load
# Wait 5 minutes and watch HPA scale back down to 2 replicas
# Take Screenshot #4 showing scale-down
```

## Cleanup When Done
```bash
az group delete --name video-streaming-rg --yes
```

---

## What You'll See:

**Initial State:**
- 2 pods per service

**Under Load:**
- Pods increase to 3, 4, 5... up to 10

**After Load Stops:**
- Pods decrease back to 2 (takes ~5 minutes)

---

## For Your Demo:

1. Show: `kubectl get pods -n video-streaming` (2 pods)
2. Generate load with curl or browser refresh
3. Show: `kubectl get hpa -n video-streaming` (CPU increasing)
4. Show: `kubectl get pods -n video-streaming` (more pods appearing)
5. Take screenshots!
