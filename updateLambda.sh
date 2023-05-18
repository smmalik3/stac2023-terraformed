#TODO: THIS IS INCOMPLETE
# Parameterize the path to lambda folder
# Create new S3 bucket in AWS for the uploaded lambda zip file
# Fix the rest of the script to reflect the above.
# Update deploy script to call this script if user wants to update a lambda function
#!/bin/bash

# Store the current working directory
parent_dir=$(pwd)

# Navigate to the child folder
cd path/to/child/folder

# Run npm install
npm install
npm_exit_code=$?

# Navigate back to the parent folder
cd "$parent_dir"

# Check npm install exit code
if [ $npm_exit_code -ne 0 ]; then
  echo "npm install failed with exit code $npm_exit_code"
  exit $npm_exit_code
fi

# Zip the folder
zip -r folder.zip path/to/child/folder
zip_exit_code=$?

# Check zip exit code
if [ $zip_exit_code -ne 0 ]; then
  echo "Failed to create the zip file. Zip command exited with code $zip_exit_code"
  exit $zip_exit_code
fi

# Upload the zip file to S3 bucket
aws s3 cp folder.zip s3://your-bucket-name/
s3_cp_exit_code=$?

# Check S3 cp exit code
if [ $s3_cp_exit_code -ne 0 ]; then
  echo "Failed to upload the zip file to S3. S3 cp command exited with code $s3_cp_exit_code"
  exit $s3_cp_exit_code
fi