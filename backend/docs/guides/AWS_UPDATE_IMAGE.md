# AWS Update Image Guide

This guide shows how to push an updated Docker image to Amazon ECR and deploy it to ECS (Fargate or EC2). It includes two deployment approaches:

- Quick (force new deployment if your Task Definition uses `:latest`).
- Recommended (create a new image tag and register a new Task Definition revision).

Replace placeholders (e.g., `YOUR_ACCOUNT_ID`, `REGION`, `REPOSITORY`, `CLUSTER`, `SERVICE`, `TASK_DEFINITION`) with values from your AWS account.

**Prerequisites**
- AWS CLI installed and configured with credentials that have permissions for ECR, ECS, IAM, and (optionally) CloudWatch and S3.
- Docker installed locally (or on CI runner).
- An existing ECR repository (created earlier).

**Environment variables used in examples**
```bash
export AWS_ACCOUNT_ID=705934872956
export AWS_REGION=eu-north-1
export ECR_REPO_NAME=deepblight-backend
export IMAGE_TAG=latest    # or use a version like v1.2.3 or commit SHA
export CLUSTER=deepblight-cluster
export SERVICE=deepblight-service
```

## 1) Build and tag the Docker image

Build the image locally (run where your `Dockerfile` is):

```bash
# From repo root
docker build -t ${ECR_REPO_NAME}:${IMAGE_TAG} .
```

Tag for ECR:

```bash
docker tag ${ECR_REPO_NAME}:${IMAGE_TAG} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${IMAGE_TAG}
```

## 2) Authenticate Docker to ECR

Use the AWS CLI to authenticate Docker to ECR:

```bash
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
```

If you encounter permission errors, ensure your IAM user/role has `ecr:GetAuthorizationToken` and related ECR permissions.

## 3) Push the image to ECR

```bash
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${IMAGE_TAG}
```

Verify the image exists in ECR:

```bash
aws ecr describe-images --repository-name ${ECR_REPO_NAME} --region ${AWS_REGION}
```

## 4a) Quick deployment (if Task Definition uses `:latest`)

If your Task Definition points to the image tag `:latest`, you can force ECS to pull the new image by forcing a new deployment of the service.

```bash
aws ecs update-service --cluster ${CLUSTER} --service ${SERVICE} --force-new-deployment --region ${AWS_REGION}
```

This causes ECS to stop the old tasks and start new ones which will pull the latest image for the task definition's container image reference. NOTE: this relies on the Task Definition using an image tag (like `:latest`) rather than an immutable digest.

## 4b) Recommended deployment (create a new Task Definition revision)

Better practice: tag images with an immutable tag (e.g., commit SHA or version) and register a new Task Definition revision that references the new image. Then update the service to use the new Task Definition.

Steps:
1. Create a new task definition JSON (you can fetch current one and modify the `image` field), or use `register-task-definition` with appropriate fields. Example to fetch existing task definition name and family:

```bash
aws ecs describe-task-definition --task-definition ${TASK_DEFINITION} --region ${AWS_REGION} > taskdef.json
```

Edit `taskdef.json`:
- Remove top-level fields that `register-task-definition` will reject (like `revision`, `status`, `taskDefinitionArn`, `requiresAttributes`).
- In `containerDefinitions`, update the `image` entry to `${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${IMAGE_TAG}`.

Register new task definition revision:

```bash
aws ecs register-task-definition --cli-input-json file://taskdef.json --region ${AWS_REGION}
```

Note the returned `taskDefinition.taskDefinitionArn` (or get the `family:revision` string).

Update the service to use the new task definition:

```bash
aws ecs update-service --cluster ${CLUSTER} --service ${SERVICE} --task-definition <family:revision> --region ${AWS_REGION}
```

Alternatively, after registering a new revision you can call `--force-new-deployment` to speed rollout.

## 5) Verify deployment

- Check tasks and status in ECS Console or with CLI:

```bash
aws ecs describe-services --cluster ${CLUSTER} --services ${SERVICE} --region ${AWS_REGION}
aws ecs list-tasks --cluster ${CLUSTER} --service-name ${SERVICE} --region ${AWS_REGION}
aws ecs describe-tasks --cluster ${CLUSTER} --tasks <task-ids> --region ${AWS_REGION}
```

- Check CloudWatch logs for container output (if logging configured).

## 6) Optional: Clean up old images (ECR lifecycle policy)

ECR can be configured with a lifecycle policy to remove old images automatically. Example keep only most recent 10 images.

## 7) Updating an EC2 host (if you're not using ECS)

If you deployed to an EC2 instance running Docker, update by pulling the new image on that instance and restarting the container:

```bash
# SSH into host
docker pull ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${IMAGE_TAG}
docker stop deepblight || true
docker rm deepblight || true
docker run -d --name deepblight -p 5000:5000 \
  -e MONGO_URI=... -e AWS_ACCESS_KEY_ID=... -e AWS_SECRET_ACCESS_KEY=... \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${IMAGE_TAG}
```

## 8) CI/CD and automation suggestions

- Use commit SHA for `IMAGE_TAG` so each build is immutable (e.g., `IMAGE_TAG=$(git rev-parse --short HEAD)`).
- Use GitHub Actions, GitLab CI, or CodeBuild to build and push images automatically on merges to main branch.
- After pushing image to ECR, register a new Task Definition revision and update the ECS service automatically from CI.

## Troubleshooting
- `docker push` fails: ensure ECR auth succeeded and IAM permissions are correct.
- Tasks failing to start: check CloudWatch logs and the task definition's memory/CPU limits and environment variables.
- Container can't connect to DB: check `MONGO_URI` and security groups/VPC settings.

---

If you'd like, I can:
- Add a small script `scripts/push_and_deploy.sh` to automate these steps using your repo's variables.
- Implement a GitHub Actions workflow to build, push, and update ECS automatically on commits.

Tell me which automation you'd like and I'll scaffold it for you.
