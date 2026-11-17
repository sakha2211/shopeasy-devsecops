# 🛡️ End-to-End DevSecOps Quality Gate & Automated Testing Pipeline

An enterprise-grade DevSecOps CI/CD pipeline built with **Jenkins, SonarQube, Postman/Newman, k6, Trivy, Docker, and Kubernetes**. 

This project demonstrates **Shift-Left Security**, **Automated Contract Testing**, **Performance SLA Enforcement**, and **Zero-Downtime Deployments**.

---

## 🏗️ Architecture & Pipeline Flow

```text
+------------------+      +-------------------------+      +-------------------------+
|   Developer      | ---> |  GitHub (Source Code)   | ---> |  Jenkins CI/CD Pipeline |
|  Git Commit/Push |      +-------------------------+      +------------+------------+
+------------------+                                                    |
                                                                        v
+-----------------------------------------------------------------------+---------------------------------------+
|  STAGE 1: Git Checkout                                                                                        |
|  STAGE 2: SAST Code Analysis & Quality Gate (SonarQube) -----> [ Quality Gate Fails? Pipeline Aborts ]       |
|  STAGE 3: Automated API Contract Testing (Newman)       -----> [ Assertions Fail? Pipeline Aborts ]           |
|  STAGE 4: Automated SLA Performance Testing (k6)        -----> [ p95 > 200ms?     Pipeline Aborts ]           |
|  STAGE 5: Multi-Stage Security Hardened Docker Build                                                          |
|  STAGE 6: Container Vulnerability Scanning (Trivy)     -----> [ HIGH/CRIT CVEs?  Pipeline Aborts ]           |
|  STAGE 7: Zero-Downtime Deployment & Rollout (Kubernetes)                                                     |
|  STAGE 8: Post-Actions (Workspace Cleanup & Slack Alerts)                                                     |
+---------------------------------------------------------------------------------------------------------------+
                                                                        |
                                                                        v
                                                   +------------------------------------+
                                                   |     Kubernetes Cluster (k8s)       |
                                                   |   Namespace: shopeasy              |
                                                   |   - Deployment (RollingUpdate)     |
                                                   |   - Replicas: 2 (Non-root Pods)    |
                                                   |   - Liveness & Readiness Probes    |
                                                   |   - Service (NodePort: 30080)      |
                                                   |   - Ingress Routing Controller     |
                                                   +------------------------------------+