# Project 2 - Kubernetes Deployment Report

**Group:** Group 5  
**Date:** November 24, 2025  
**Project:** Video Streaming Microservices on Azure Kubernetes

---

## 1. Deployment Summary

### Cloud Platform
- **Provider:** Microsoft Azure
- **Service:** Azure Kubernetes Service (AKS)
- **Region:** East US
- **Cluster:** video-aks (2 nodes, Standard_B2s)

### Microservices Deployed
1. **Authentication Service** (Port 4000)
2. **Catalog Service** (Port 5001) 
3. **File System Service** (Port 5000)
4. **Web UI** (Port 80)
5. **MySQL Database** (Port 3306)

---

## 2. Kubernetes Resources Created

### Deployments
- `auth-service` - 2-10 replicas with HPA
- `catalog-service` - 2-10 replicas with HPA
- `file-service` - 2-10 replicas with HPA
- `web` - 2 replicas
- `mysql` - 1 replica (stateful)

### Services
- LoadBalancer services for external access
- ClusterIP for internal MySQL

### ConfigMaps
- Application configuration (JWT secrets, DB connection)

---

## 3. Horizontal Pod Autoscaling Configuration

### HPA Settings
```
Minimum Replicas: 2
Maximum Replicas: 10
CPU Target: 50%
```

### Scaling Behavior
- **Scale Up:** Immediate when CPU > 50%
- **Scale Down:** After 5 minutes of low load
- **Metric:** CPU utilization

---

## 4. Test Results - Horizontal Scalability

### Baseline (No Load)
```
[Paste output of: kubectl get pods -n video-streaming]
[Paste output of: kubectl get hpa -n video-streaming]

Expected: 2 pods per service
```

### During Load Test
```
[Paste output during load test]

Expected: Pods increase to 3-10 based on CPU
```

### After Load Removed
```
[Paste output 5 minutes after load stopped]

Expected: Pods scale back down to 2
```

### Evidence
- [ ] Screenshot: Initial state (2 pods)
- [ ] Screenshot: HPA showing high CPU
- [ ] Screenshot: Scaled state (5-10 pods)
- [ ] Screenshot: Scale-down (back to 2 pods)

---

## 5. Commands Used

### Deployment Commands
```bash
az login
az group create --name video-streaming-rg --location eastus
az acr create --resource-group video-streaming-rg --name [YOUR_ACR_NAME] --sku Basic
az aks create --resource-group video-streaming-rg --name video-aks --node-count 2
kubectl apply -f k8s/
```

### Monitoring Commands
```bash
kubectl get pods -n video-streaming
kubectl get hpa -n video-streaming
kubectl get svc -n video-streaming
kubectl top pods -n video-streaming
```

---

## 6. Scalability Demonstration

### Test Scenario
1. Generate load using curl loop or browser refresh
2. Monitor HPA with: `kubectl get hpa -n video-streaming --watch`
3. Observe pod count increase with: `kubectl get pods -n video-streaming`

### Results
| Time | CPU Usage | Pod Count | Status |
|------|-----------|-----------|--------|
| 0:00 | ~10% | 2 | Baseline |
| 1:00 | ~80% | 4 | Scaling Up |
| 2:00 | ~70% | 6 | Scaled |
| 5:00 | ~15% | 6 | Waiting |
| 10:00 | ~10% | 2 | Scaled Down |

*[Fill in with your actual results]*

---

## 7. Chapter 20 Concepts Demonstrated

### From "The Kubernetes Bible" Chapter 20

✅ **Horizontal Pod Autoscaler (HPA)**
- Configured CPU-based autoscaling
- Minimum and maximum replica counts
- Automatic scaling decisions

✅ **Metrics Server**
- Installed for resource monitoring
- Provides CPU/memory metrics to HPA

✅ **Resource Requests and Limits**
- Defined in deployment specs
- Required for HPA to function

✅ **Load Balancing**
- Azure Load Balancer distributes traffic
- Kubernetes Service abstracts pods

✅ **Self-Healing**
- Pods automatically restart on failure
- Deployments maintain desired state

---

## 8. Benefits of This Architecture

### Scalability
- Automatically handles traffic spikes
- No manual intervention required
- Can scale from 2 to 10 pods per service

### Cost Efficiency
- Scales down during low traffic
- Only pay for resources when needed
- ~$2-3/day vs fixed infrastructure

### Reliability
- Multiple replicas provide redundancy
- Self-healing replaces failed pods
- Load balancing distributes load

### Cloud Native
- Industry-standard Kubernetes
- Portable across cloud providers
- Modern microservices architecture

---

## 9. Challenges and Solutions

### Challenge 1: Image Pull Errors
**Problem:** Pods couldn't pull images from ACR  
**Solution:** Attached ACR to AKS cluster with `--attach-acr`

### Challenge 2: HPA Showing "Unknown"
**Problem:** Metrics not available immediately  
**Solution:** Wait 2-3 minutes for metrics server to collect data

### Challenge 3: External IPs Pending
**Problem:** LoadBalancer services stuck in pending  
**Solution:** Wait 5-10 minutes for Azure to provision load balancers

---

## 10. Conclusion

Successfully deployed video streaming microservices to Azure Kubernetes Service with horizontal pod autoscaling. Demonstrated:

- Automatic scaling from 2 to 10 pods based on CPU load
- Scale-down behavior after load removal
- Cloud-native architecture using Kubernetes
- Concepts from Chapter 20 (HPA, metrics, resource management)

The system can handle variable load efficiently, scaling resources up when needed and down to save costs during idle periods.

---

## 11. Cleanup

```bash
az group delete --name video-streaming-rg --yes
```

**Cost:** ~$2-3/day while running  
**Duration:** Project ran for X days  
**Total Cost:** $X

---

## Appendix: YAML Files

### Namespace
```yaml
[Contents of 01-namespace.yaml]
```

### HPA Configuration
```yaml
[Example HPA from 04-auth-service.yaml]
```

### Service Configuration
```yaml
[Example LoadBalancer service]
```
