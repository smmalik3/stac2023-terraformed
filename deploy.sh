#!/bin/bash

if [ -e "variables.tf" ]
then
  echo "File variables.tf exists in the current directory."
  sleep 3
  # Proceed to the next command
else
  echo "File variables.tf does not exist in the current directory."
  echo "-------------------------------------------"
  echo 'variables.tf should look like the following:
        variable "region" {
          default = "us-east-1"
        }

        variable "OPENAI_API_KEY" {
          type    = string
          default = "ENTER_OPENAI_API_KEY_HERE"
        }'
  exit 1
fi

if [[ $# -eq 1 ]]; then
  if [[ $1 == "terraform" ]]; then
    echo "Running Terraform deployment..."
    sleep 2
    terraform init
    sleep 2
    terraform apply
    echo "Deploy complete!! Now test your code!"
    exit 0
  else
    echo "Invalid input. Please provide 'terraform' as the input."
    exit 1
  fi
elif [[ $# -eq 2 ]]; then
  if [[ $1 == "terraform" ]]; then
    lambda_function_name=$2
    zip_filename="$lambda_function_name.zip"

    if [[ -f $zip_filename ]]; then
      echo "Existing zip file found: $zip_filename. Deleting it..."
      sleep 2
      rm $zip_filename
    fi

    echo "Creating a new zip file: $zip_filename..."
    sleep 2
    # Add the code to create the new zip file
    foldername=$2
    foldername="${foldername%/}"  # Remove trailing slash if present

    if [[ -d $foldername ]]; then
      zip_filename="${foldername}.zip"
      echo "Creating zip file: $zip_filename..."

      # Create the zip file
      zip -r "$zip_filename" "$foldername"

      echo "Zip file created successfully."
    else
      echo "Folder '$foldername' does not exist."
      exit 1
    fi
    echo "Running Terraform deployment for Lambda function: $lambda_function_name..."
    sleep 2
    terraform init
    sleep 2
    terraform apply
    echo "Deploy complete!! Now test your code!"
    exit 0
  else
    echo "Invalid input. Please provide 'terraform' as the first input."
    exit 1
  fi
else
  echo "Invalid number of inputs. Please provide either one input for Terraform or two inputs for Terraform and the Lambda function name."
  exit 1
fi
