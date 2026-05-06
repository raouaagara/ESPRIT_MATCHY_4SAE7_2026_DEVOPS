pipeline {
    agent any

    parameters {
        string(name: 'APP_VERSION', defaultValue: '1.0.0', description: 'Version Maven et Docker')
    }

    environment {
        MAVEN_OPTS = '-Dmaven.test.failure.ignore=false'
        JAVA_HOME = tool name: 'JDK17', type: 'jdk'
        PATH = "${env.JAVA_HOME}/bin:${env.PATH}"
        IMAGE_NAME = "content-service"
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh './mvnw clean package -DskipTests'
            }
        }

        stage('Test') {
            steps {
                sh './mvnw test'
            }
        }

        stage('Publish to Nexus') {
            steps {
                sh "./mvnw deploy -DskipTests -Drevision=${params.APP_VERSION}"
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    docker.build("${env.IMAGE_NAME}:${params.APP_VERSION}")
                }
            }
        }
    }

    post {
        success {
            echo 'CI content-service réussie'
        }
        failure {
            echo 'Échec de la CI content-service'
        }
    }
}