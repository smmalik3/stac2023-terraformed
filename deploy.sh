#!/bin/bash

if [ -z "$1" ]; then
  echo "Please provide lambda function name."
  exit 1
fi

folder_name=$1

# Create zip file
echo "Zipping lambda function ${folder_name}..."
zip -r "${folder_name}.zip" "${folder_name}"

# Initialize Terraform
echo "Initializing Terraform..."
terraform init

# Apply Terraform changes
echo "Applying Terraform changes..."
terraform apply

