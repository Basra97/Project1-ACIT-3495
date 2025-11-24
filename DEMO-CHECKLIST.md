# Demo Checklist - Project 2

Use this checklist during your presentation/demo.

---

## Before Demo

- [ ] Azure AKS cluster is running
- [ ] All services deployed (`kubectl get pods -n video-streaming`)
- [ ] All LoadBalancers have External IPs (`kubectl get svc -n video-streaming`)
- [ ] Screenshots prepared (see below)
- [ ] Terminal/command prompt ready

---

## Demo Flow (10-15 minutes)

### 1. Introduction (2 min)
- [ ] Explain project: Video streaming microservices
- [ ] State goal: Demonstrate horizontal scalability on Kubernetes
- [ ] Mention Azure AKS and Chapter 20 concepts

### 2. Show Architecture (2 min)
- [ ] Open browser with architecture diagram or show YAML files
- [ ] Explain 5 microservices (auth, catalog, file, web, mysql)
- [ ] Mention HorizontalPodAutoscaler configuration

### 3. Show Initial State (2 min)
```bash
# Show cluster
kubectl get nodes

# Show pods (should be 2 per service)
kubectl get pods -n video-streaming

# Show HPA baseline
kubectl get hpa -n video-streaming

# Show current metrics
kubectl top pods -n video-streaming
```

### 4. Generate Load (3 min)
```bash
# Get service IP
kubectl get svc auth-service -n video-streaming

# Start load in one terminal
while true; do curl http://EXTERNAL-IP:4000; done

# In another terminal, watch scaling
kubectl get hpa -n video-streaming --watch
```

### 5. Show Scaling Up (3 min)
```bash
# Show HPA increasing CPU and replicas
kubectl get hpa -n video-streaming

# Show new pods appearing
kubectl get pods -n video-streaming

# Show pod count increased (e.g., from 2 to 6)
```

### 6. Explain Behavior (2 min)
- [ ] Explain why it scaled (CPU > 50%)
- [ ] Mention it can scale to 10 pods max
- [ ] Explain scale-down happens after 5 minutes of low load
- [ ] Connect to Chapter 20 concepts

### 7. Q&A (1 min)
- [ ] Answer questions
- [ ] Show any additional screenshots

---

## Screenshots to Prepare

### Screenshot 1: Cluster Info
```bash
kubectl get nodes
kubectl cluster-info
```

### Screenshot 2: Initial Pods
```bash
kubectl get pods -n video-streaming
# Should show 2 pods per service
```

### Screenshot 3: Initial HPA
```bash
kubectl get hpa -n video-streaming
# Should show low CPU, 2/2 replicas
```

### Screenshot 4: Services
```bash
kubectl get svc -n video-streaming
# Show LoadBalancer external IPs
```

### Screenshot 5: During Load - HPA
```bash
kubectl get hpa -n video-streaming
# Should show high CPU (70-90%), increasing replicas
```

### Screenshot 6: During Load - Pods
```bash
kubectl get pods -n video-streaming
# Should show 5-10 pods per service
```

### Screenshot 7: Metrics
```bash
kubectl top pods -n video-streaming
# Show high CPU usage during load
```

### Screenshot 8: Scale Down (Optional)
```bash
# After 5+ minutes of no load
kubectl get hpa -n video-streaming
kubectl get pods -n video-streaming
# Should show back to 2 pods
```

---

## Key Points to Mention

✅ **Horizontal Scalability**
- System automatically adds pods under load
- Scales from 2 to 10 based on CPU usage

✅ **Chapter 20 Concepts**
- HorizontalPodAutoscaler (HPA)
- Metrics Server for monitoring
- Resource requests/limits
- Scaling policies

✅ **Cloud Native**
- Running on Azure Kubernetes Service
- Industry-standard platform
- Can be deployed on any cloud

✅ **Benefits**
- Handles traffic spikes automatically
- Cost efficient (scales down when idle)
- No manual intervention needed

✅ **Real World**
- Netflix, Spotify use similar architecture
- Standard for modern applications
- Production-ready deployment

---

## Expected Questions & Answers

**Q: Why use Kubernetes?**  
A: Industry standard, automatic scaling, self-healing, cloud-agnostic

**Q: How does HPA decide when to scale?**  
A: Monitors CPU usage every 15 seconds, scales when >50% for our config

**Q: What if a pod crashes?**  
A: Kubernetes automatically restarts it (self-healing)

**Q: Why not just use bigger servers?**  
A: Horizontal scaling is more flexible, cost-effective, and resilient

**Q: How much does this cost?**  
A: ~$2-3/day on Azure for this small cluster

**Q: Can this work on AWS or GCP?**  
A: Yes! Kubernetes is portable across clouds, just change AKS to EKS/GKE

---

## Backup Plans

**If load test doesn't scale immediately:**
- Mention metrics collection delay (30-60 seconds)
- Show previous screenshots of successful scaling
- Explain HPA algorithm needs sustained load

**If demo environment is down:**
- Have screenshots ready
- Walk through YAML files showing HPA config
- Explain what would happen

**If time is short:**
- Skip to screenshots
- Focus on HPA configuration explanation
- Show key metrics only

---

## After Demo

- [ ] Stop load generation (Ctrl+C)
- [ ] Show cleanup command: `az group delete --name video-streaming-rg --yes`
- [ ] Thank audience
- [ ] Answer additional questions

---

## Time Allocation

- Introduction: 2 min
- Architecture: 2 min  
- Initial state: 2 min
- Load generation: 3 min
- Scaling observation: 3 min
- Explanation: 2 min
- Q&A: 1 min

**Total: ~15 minutes**
