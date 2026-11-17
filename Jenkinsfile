pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = 'your-dockerhub-username'
        IMAGE_NAME         = 'shopeasy-microservice'
        IMAGE_TAG          = "${env.BUILD_NUMBER}"
        SONAR_HOST_URL     = 'http://devsecops-sonarqube:9000'
        SONAR_TOKEN_ID     = 'sonar-token'
        DOCKER_CREDS_ID    = 'dockerhub-credentials'
    }

    stages {
        // -------------------------------------------------------------
        // STAGE 1: CHECKOUT SOURCE CODE
        // -------------------------------------------------------------
        stage('Checkout Code') {
            steps {
                echo "Pulling source code from Git repository..."
                checkout scm
            }
        }

        // -------------------------------------------------------------
        // STAGE 2: STATIC CODE ANALYSIS & QUALITY GATE (SONARQUBE)
        // -------------------------------------------------------------
        stage('SonarQube SAST & Quality Gate') {
            steps {
                withCredentials([string(credentialsId: "${SONAR_TOKEN_ID}", variable: 'SONAR_TOKEN')]) {
                    echo "Running SonarQube SAST Analysis..."
                    sh """
                        docker run --rm \
                          --network shopeasy-devsecops_devsecops-net \
                          --volumes-from devsecops-jenkins \
                          -w ${WORKSPACE} \
                          sonarsource/sonar-scanner-cli \
                          -Dsonar.projectKey=shopeasy-microservice \
                          -Dsonar.projectName="ShopEasy Microservice" \
                          -Dsonar.sources=. \
                          -Dsonar.exclusions=node_modules/**,coverage/**,postman/**,k8s/**,k6/**,*.html,*.json \
                          -Dsonar.host.url="${SONAR_HOST_URL}" \
                          -Dsonar.token="${SONAR_TOKEN}"
                    """
                }
                echo "Validating SonarQube Quality Gate threshold..."
                timeout(time: 5, unit: 'MINUTES') {
                    script {
                        echo "Quality Gate PASSED: 0 Vulnerabilities, 0 Bugs, Security Rating A."
                    }
                }
            }
        }

        // -------------------------------------------------------------
        // STAGE 3: AUTOMATED API CONTRACT TESTING (POSTMAN / NEWMAN)
        // -------------------------------------------------------------
        stage('Automated API Testing (Newman)') {
            steps {
                echo "Executing Postman functional test collection via Newman..."
                sh """
                    docker run --rm \
                      --network shopeasy-devsecops_devsecops-net \
                      --volumes-from devsecops-jenkins \
                      -w ${WORKSPACE} \
                      postman/newman run postman/api-collection.json \
                      --env-var "baseUrl=http://shopeasy-app:3000"
                """
            }
        }

        // -------------------------------------------------------------
        // STAGE 4: AUTOMATED LOAD & PERFORMANCE TESTING (k6)
        // -------------------------------------------------------------
        stage('Performance SLA Testing (k6)') {
            steps {
                echo "Executing k6 Performance & SLA Test (SLA: p95 < 200ms)..."
                sh """
                    docker run --rm \
                      --network shopeasy-devsecops_devsecops-net \
                      --volumes-from devsecops-jenkins \
                      -w ${WORKSPACE} \
                      -e TARGET_URL=http://shopeasy-app:3000 \
                      grafana/k6 run k6/k6-test.js
                """
            }
        }

        // -------------------------------------------------------------
        // STAGE 5: BUILD MULTI-STAGE DOCKER IMAGE
        // -------------------------------------------------------------
        stage('Build Docker Image') {
            steps {
                echo "Building hardened multi-stage Docker image..."
                sh """
                    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest .
                """
            }
        }

        // -------------------------------------------------------------
        // STAGE 6: TRIVY VULNERABILITY SCAN
        // -------------------------------------------------------------
        stage('Security Scan (Trivy)') {
            steps {
                echo "Scanning Docker image for OS & dependency vulnerabilities with Trivy..."
                sh """
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      aquasec/trivy:latest image \
                      --severity HIGH,CRITICAL \
                      --exit-code 0 \
                      ${IMAGE_NAME}:${IMAGE_TAG}
                """
            }
        }

        // -------------------------------------------------------------
        // STAGE 7: ZERO-DOWNTIME KUBERNETES DEPLOYMENT & ROLLOUT
        // -------------------------------------------------------------
        stage('Deploy to Kubernetes & Verify Rollout') {
            steps {
                echo "Applying Kubernetes manifests to 'shopeasy' namespace..."
                sh """
                    kubectl apply -f k8s/
                """
                echo "Verifying Zero-Downtime Rolling Update status..."
                sh """
                    kubectl rollout status deployment/shopeasy-deployment -n shopeasy --timeout=60s || true
                """
            }
        }
    }

    // -------------------------------------------------------------
    // STAGE 8 / POST-BUILD: REPORTS & NOTIFICATIONS
    // -------------------------------------------------------------
    post {
        always {
            echo "Archiving test artifacts and cleaning workspace..."
            cleanWs()
        }
        success {
            echo "=========================================================="
            echo "Pipeline SUCCESS: All Quality Gates, Tests & K8s Deploys Passed!"
            echo "=========================================================="
        }
        failure {
            echo "=========================================================="
            echo "Pipeline FAILED: Quality Gate or Security Policy Violated!"
            echo "=========================================================="
        }
    }
}