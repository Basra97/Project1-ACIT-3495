# Project 2 Presentation Script & Slide Organization

## Presentation Structure (10-15 minutes)

---

## **SLIDE 1: Title Slide**
**Visual:** Project title, your name, course info, date

**Script:**
> "Good [morning/afternoon], I'm [Your Name] and today I'll be demonstrating my Project 2: Deploying a Video Streaming Microservices Application to Azure Kubernetes Service with Horizontal Pod Autoscaling."

---

## **SLIDE 2: Project Overview**
**Visual:** Architecture diagram showing:
- 4 microservices (Auth, Catalog, File, Web)
- MySQL database
- Azure AKS cluster
- Load balancers

**Script:**
> "This project demonstrates a cloud-native video streaming platform deployed on Azure Kubernetes Service. The application consists of four microservices: an authentication service for user login, a catalog service for managing video metadata, a file storage service for handling video uploads, and a web frontend. All services communicate through REST APIs and are deployed as containerized applications on Kubernetes."

---

## **SLIDE 3: Technology Stack**
**Visual:** Logos/icons of technologies used

**Technologies:**
- Azure Kubernetes Service (AKS)
- Docker & Azure Container Registry
- Node.js microservices
- MySQL database
- Horizontal Pod Autoscaler
- Nginx web server

**Script:**
> "The tech stack includes Azure Kubernetes Service for container orchestration, Docker for containerization with images stored in Azure Container Registry, Node.js for the backend microservices, MySQL for persistent data storage, and Kubernetes Horizontal Pod Autoscaler for automatic scaling based on CPU metrics."

---

## **SLIDE 4: Initial Deployment State**
**Visual:** Screenshot showing:
- `kubectl get pods -n video-streaming` (9 pods total)
- 2 replicas each for auth, catalog, file services
- 2 web pods, 1 MySQL pod

**Script:**
> "Here's our initial deployment state. We have 2 replicas of each microservice running - that's 2 auth service pods, 2 catalog service pods, and 2 file service pods. We also have 2 web frontend pods and 1 MySQL database pod. This gives us 9 total pods running in our cluster."

---

## **SLIDE 5: HPA Configuration**
**Visual:** Screenshot of `kubectl get hpa -n video-streaming` showing:
- CPU target: 1%/50%
- Min replicas: 2
- Max replicas: 10

**Script:**
> "The Horizontal Pod Autoscaler is configured to monitor CPU utilization with a target threshold of 50%. Each service has a minimum of 2 replicas for high availability and can scale up to 10 replicas under heavy load. Initially, our CPU usage is very low at only 1%."

---

## **SLIDE 6: Application Demonstration**
**Visual:** Screenshot of web application
- Login page or main page with video
- Settings showing service URLs

**Script:**
> "Let me quickly show you the application in action. Users can log in, browse videos in the catalog, and upload new content. The authentication service issues JWT tokens, the catalog service queries the MySQL database for video metadata, and the file service handles the actual video storage and streaming."

---

## **SLIDE 7: Load Generation Setup**
**Visual:** Terminal showing the curl command:
```bash
while true; do curl -X POST http://172.184.107.226:4000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  > /dev/null 2>&1; done
```

**Script:**
> "To demonstrate horizontal scaling, I need to generate significant load on our services. I'm using a simple bash script that continuously sends login requests to the authentication service. This simulates multiple users accessing the application simultaneously. I actually ran this command in 10 terminal windows simultaneously to generate enough CPU pressure."

---

## **SLIDE 8: Scaling in Action - CPU Spike**
**Visual:** Screenshot of HPA showing:
- CPU: 85%/50% (or highest you captured)
- REPLICAS: 2 → 4 transition visible

**Script:**
> "As the load increases, we can see the CPU utilization spike to 85%, well above our 50% threshold. The Horizontal Pod Autoscaler detects this and immediately begins scaling up. Watch how the replica count changes from 2 to 4 to handle the increased demand."

---

## **SLIDE 9: Scaled State**
**Visual:** Split screen or two screenshots:
- Left: HPA showing multiple entries with 4 replicas
- Right: Pods list showing 4 auth-service pods running

**Script:**
> "Here we see the scaled state. The HPA has successfully created 4 replicas of the auth service to distribute the load. You can see all 4 pods are in Running status, ready to handle requests. This demonstrates Kubernetes' ability to automatically adapt to demand without manual intervention."

---

## **SLIDE 10: Scale Down**
**Visual:** Screenshot showing:
- HPA with CPU back down to low percentage
- REPLICAS: 4 → 2 transition
- Pods showing Terminating status

**Script:**
> "After I stopped generating load, the CPU utilization dropped back down. Kubernetes waits about 5 minutes to ensure the load decrease is sustained, then begins scaling down. The HPA terminates the extra pods and returns to our minimum of 2 replicas. This scale-down behavior prevents unnecessary resource usage and reduces costs."

---

## **SLIDE 11: Benefits of Horizontal Scaling**
**Visual:** Bullet points with icons

**Key Benefits:**
- **Cost Efficiency:** Pay only for resources you need
- **High Availability:** Multiple replicas prevent single points of failure
- **Performance:** Distributed load across multiple pods
- **Elasticity:** Automatic adaptation to demand fluctuations
- **Zero Downtime:** New pods start before old ones terminate

**Script:**
> "Horizontal pod autoscaling provides several key benefits. First, cost efficiency - we only pay for resources when we need them. Second, high availability - if one pod fails, others continue serving requests. Third, better performance through load distribution. Fourth, elasticity - the system automatically adapts to traffic patterns. And finally, zero downtime during scaling operations."

---

## **SLIDE 12: Technical Challenges & Solutions**
**Visual:** Two-column layout: Challenge → Solution

**Challenges & Solutions:**
- **Challenge:** Large video files slow to load
  - **Solution:** Implemented JWT token-based authentication for secure streaming
  
- **Challenge:** MySQL data persistence across restarts
  - **Solution:** Manual table recreation; could use persistent volumes in production
  
- **Challenge:** Load generation insufficient with single thread
  - **Solution:** Ran multiple parallel curl processes (50+) to reach CPU threshold

**Script:**
> "During development, I encountered several challenges. Large video files were slow to load, which I addressed by implementing JWT authentication for secure streaming. MySQL data wasn't persisting across pod restarts - in production we'd use persistent volumes, but for this demo I manually recreated tables. And initially, my load generation wasn't strong enough to trigger scaling, so I had to run 50+ parallel processes to push CPU above the threshold."

---

## **SLIDE 13: Cloud Architecture Benefits**
**Visual:** Comparison diagram or bullet points

**Kubernetes/Cloud Benefits:**
- **Declarative Configuration:** Infrastructure as code with YAML
- **Self-Healing:** Automatic pod restart on failure
- **Service Discovery:** Built-in DNS and load balancing
- **Rolling Updates:** Zero-downtime deployments
- **Resource Management:** CPU/memory limits and requests

**Script:**
> "This project demonstrates key cloud-native architecture principles. Kubernetes uses declarative configuration through YAML files, making infrastructure reproducible. It provides self-healing by automatically restarting failed pods. Service discovery and load balancing are built-in. Rolling updates enable zero-downtime deployments. And resource management ensures fair allocation across all workloads."

---

## **SLIDE 14: Real-World Applications**
**Visual:** Examples with icons/images

**Use Cases:**
- **E-commerce:** Scale during flash sales, Black Friday
- **Streaming Services:** Handle peak viewing hours
- **Social Media:** Respond to viral content spikes
- **Gaming:** Match player concurrency in real-time
- **IoT Applications:** Process sensor data bursts

**Script:**
> "This horizontal scaling pattern applies to many real-world scenarios. E-commerce sites scale during flash sales. Streaming services handle evening peak hours. Social media platforms respond to viral content. Gaming servers match player concurrency. And IoT applications process sudden sensor data bursts. The ability to automatically scale is critical for modern cloud applications."

---

## **SLIDE 15: Lessons Learned & Future Improvements**
**Visual:** Bullet points in two sections

**Lessons Learned:**
- Metrics server is essential for HPA functionality
- Resource requests/limits impact scaling decisions
- Load generation needs to be substantial for testing
- Service mesh could improve observability

**Future Improvements:**
- Implement persistent volumes for MySQL
- Add Prometheus/Grafana for monitoring
- Use Helm charts for easier deployment
- Configure auto-scaling based on custom metrics (requests/sec)
- Add CI/CD pipeline for automated deployments

**Script:**
> "I learned several valuable lessons. The metrics server is absolutely essential for HPA to function. Properly setting resource requests and limits is critical for scaling decisions. And realistic load testing requires substantial traffic generation. For future improvements, I would add persistent storage for the database, implement proper monitoring with Prometheus and Grafana, use Helm charts for deployment management, configure custom metrics beyond just CPU, and set up a CI/CD pipeline for continuous deployment."

---

## **SLIDE 16: Conclusion**
**Visual:** Summary with key metrics

**Project Achievements:**
- ✅ Deployed 4 microservices to Azure AKS
- ✅ Configured HPA with 2-10 replica range
- ✅ Demonstrated automatic scaling (2→4→2 replicas)
- ✅ CPU threshold triggering (50% target, 85% peak)
- ✅ Fully functional video streaming application

**Script:**
> "In conclusion, I successfully deployed a multi-tier microservices application to Azure Kubernetes Service, configured Horizontal Pod Autoscalers for all services, and demonstrated automatic scaling in response to load. The system scaled from 2 to 4 replicas when CPU exceeded 50%, reaching a peak of 85%, then automatically scaled back down when load decreased. The application is fully functional with authentication, video catalog, and file streaming capabilities."

---

## **SLIDE 17: Q&A**
**Visual:** "Questions?" with your contact info

**Script:**
> "Thank you for your attention. I'm happy to answer any questions about the architecture, implementation, or scaling behavior."

---

## **Preparation Tips:**

### **Before Presentation:**
1. Take all screenshots in advance (don't rely on live demo)
2. Practice the script 2-3 times
3. Time yourself (aim for 10-12 minutes to leave time for Q&A)
4. Have backup screenshots in case slides don't load
5. Test your screen sharing if presenting remotely

### **During Presentation:**
1. Speak slowly and clearly
2. Point to specific parts of screenshots as you explain
3. Make eye contact (not just reading slides)
4. Pause after each major point
5. Show enthusiasm for your work!

### **Common Q&A Prep:**
- **"Why 50% CPU threshold?"** → Industry standard, balances responsiveness and cost
- **"How long does scaling take?"** → Scale up: ~30 seconds, Scale down: ~5 minutes
- **"What about database scaling?"** → Horizontal scaling databases is complex; vertical scaling or managed services often better
- **"Production considerations?"** → Persistent volumes, monitoring, logging, backup strategies
- **"Cost of running this?"** → Small AKS cluster ~$70-100/month; can shut down when not in use

---

## **Delivery Time Breakdown:**

- Intro & Overview: 1 minute
- Technology & Architecture: 2 minutes
- Initial State & Configuration: 2 minutes
- Demo & Scaling: 4 minutes
- Benefits & Challenges: 2 minutes
- Conclusion: 1 minute
- **Total: ~12 minutes (leaves 3 minutes for Q&A in 15-min slot)**

---

**Good luck with your presentation! You've done excellent work on this project.**
