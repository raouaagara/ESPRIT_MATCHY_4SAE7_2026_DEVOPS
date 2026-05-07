pipeline {
    agent any
    tools {
        maven 'maven'
    }
    triggers {
        pollSCM('* * * * *')
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm  // ✅ checkout automatique de la branche qui a déclenché le pipeline
            }
        }
        stage('Detect Changes') {
            steps {
                script {
                    def branch = env.GIT_BRANCH?.replaceFirst('origin/', '') ?: sh(
                        script: 'git rev-parse --abbrev-ref HEAD',
                        returnStdout: true
                    ).trim()

                    def changes = sh(
                        script: 'git diff --name-only HEAD~1 HEAD 2>/dev/null || echo ""',
                        returnStdout: true
                    ).trim()

                    echo "🌿 Branche : ${branch}"
                    echo "📝 Fichiers modifiés : ${changes}"

                    if (branch == 'user_project_management') {
                        echo "👤 Branche Raouaa"
                        env.BUILD_BACKEND = changes.contains('src') || changes.contains('pom.xml') || changes.contains('Dockerfile') ? 'true' : 'false'
                        env.BUILD_FRONTEND = changes.contains('angular.json') || changes.contains('package.json') || changes.contains('src/app') ? 'true' : 'false'

                    } else if (branch == 'content-service') {
                        echo "📄 Branche Content Service"
                        env.BUILD_BACKEND = changes.contains('src') || changes.contains('pom.xml') ? 'true' : 'false'
                        env.BUILD_FRONTEND = 'false'

                    } else if (branch == 'millestone-service') {
                        echo "🏁 Branche Milestone Service"
                        env.BUILD_BACKEND = changes.contains('src') || changes.contains('pom.xml') ? 'true' : 'false'
                        env.BUILD_FRONTEND = 'false'

                    } else if (branch == 'subscription-service') {
                        echo "💳 Branche Subscription Service"
                        env.BUILD_BACKEND = changes.contains('src') || changes.contains('pom.xml') ? 'true' : 'false'
                        env.BUILD_FRONTEND = 'false'

                    } else if (branch == 'main') {
                        echo "🚀 Branche Main"
                        env.BUILD_BACKEND = 'false'
                        env.BUILD_FRONTEND = changes.contains('angular.json') || changes.contains('package.json') || changes.contains('src/app') ? 'true' : 'false'

                    } else if (branch == 'test-pipeline') {
                        echo "🧪 Branche Test"
                        env.BUILD_BACKEND = 'true'
                        env.BUILD_FRONTEND = 'false'

                    } else {
                        echo "⛔ Branche inconnue - rien à builder"
                        env.BUILD_BACKEND = 'false'
                        env.BUILD_FRONTEND = 'false'
                    }

                    echo "BUILD_BACKEND=${env.BUILD_BACKEND} | BUILD_FRONTEND=${env.BUILD_FRONTEND}"
                }
            }
        }

        // ===== BACKEND =====
        stage('Backend Build') {
            when { expression { env.BUILD_BACKEND == 'true' } }
            steps {
                sh 'mvn clean package -DskipTests'
            }
        }
        stage('Backend Test') {
            when { expression { env.BUILD_BACKEND == 'true' } }
            steps {
                sh 'mvn test -Dtest="MatchingServiceTest"'
            }
        }
        stage('SonarQube') {
            when { expression { env.BUILD_BACKEND == 'true' } }
            steps {
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh """
                        mvn sonar:sonar \
                        -Dsonar.projectKey=matchy-service \
                        -Dsonar.host.url=http://192.168.150.130:9000 \
                        -Dsonar.login=${SONAR_TOKEN}
                    """
                }
            }
        }
        stage('Backend Docker Build') {
            when { expression { env.BUILD_BACKEND == 'true' } }
            steps {
                sh 'docker build -t matchy-service:latest .'
            }
        }
        stage('Backend Nexus Push') {
            when { expression { env.BUILD_BACKEND == 'true' } }
            steps {
                withCredentials([usernamePassword(credentialsId: 'nexus-credentials', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                    sh '''
                        echo $NEXUS_PASS | docker login 192.168.150.130:8082 -u $NEXUS_USER --password-stdin
                        docker tag matchy-service:latest 192.168.150.130:8082/matchy-service:latest
                        docker push 192.168.150.130:8082/matchy-service:latest || true
                    '''
                }
            }
        }

        // ===== FRONTEND =====
        stage('Checkout Main (Frontend)') {
            when { expression { env.BUILD_FRONTEND == 'true' } }
            steps {
                dir('frontend-repo') {
                    git branch: 'main', url: 'https://github.com/raouaagara/ESPRIT_MATCHY_4SAE7_2026_DEVOPS.git'
                }
            }
        }
        stage('Frontend Install') {
            when { expression { env.BUILD_FRONTEND == 'true' } }
            steps {
                dir('frontend-repo') { sh 'npm install' }
            }
        }
        stage('Frontend Build') {
            when { expression { env.BUILD_FRONTEND == 'true' } }
            steps {
                dir('frontend-repo') { sh 'npm run build -- --configuration production' }
            }
        }
        stage('Frontend Docker Build') {
            when { expression { env.BUILD_FRONTEND == 'true' } }
            steps {
                dir('frontend-repo') { sh 'docker build -t matchy-frontend:latest .' }
            }
        }
        stage('Frontend Nexus Push') {
            when { expression { env.BUILD_FRONTEND == 'true' } }
            steps {
                withCredentials([usernamePassword(credentialsId: 'nexus-credentials', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                    sh '''
                        echo $NEXUS_PASS | docker login 192.168.150.130:8082 -u $NEXUS_USER --password-stdin
                        docker tag matchy-frontend:latest 192.168.150.130:8082/matchy-frontend:latest
                        docker push 192.168.150.130:8082/matchy-frontend:latest || true
                    '''
                }
            }
        }

        // ===== DEPLOY =====
        stage('Deploy K8s') {
            when {
                expression { env.BUILD_BACKEND == 'true' || env.BUILD_FRONTEND == 'true' }
            }
            steps {
                sh 'kubectl apply -f k8s/'
            }
        }
    }
    post {
        success { echo '✅ Pipeline terminé avec succès !' }
        failure { echo '❌ Pipeline échoué !' }
    }
}