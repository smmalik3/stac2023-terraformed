# stac2023-terraformed
STAC 2023 lambdas and other architecture deployed and managed by Terraform

## Setting things up

1. Install [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
2. Install [Terraform](https://developer.hashicorp.com/terraform/downloads)
3. Create [Access Keys](https://docs.aws.amazon.com/powershell/latest/userguide/pstools-appendix-sign-up.html) for your AWS user
    - In console type `aws configure`
    - Enter your AWS Access Key
    - Enter your AWS Secret Key
4. Run the deploy script by entering `./deploy.sh`
    - Follow any feedback from the script to get going or read on below
    - You need a variables.tf file in your root directory that looks similar to:
        ```
            variable "region" {
            default = "us-east-1"
            }

            variable "OPENAI_API_KEY" {
            type    = string
            default = "ENTER_OPENAI_API_KEY_HERE"
            }'
        ```
        - **NOTE:** *variables.tf* is where all the lambda environment variables will be stored, never commit to repo.
    - The command to deploy your terraform is
        ` ./deploy.sh terraform`
    - The command to deploy a lambda function is
        ` ./deploy.sh terraform 'lambda_function_name'`
        - Example: ` ./deploy.sh terraform fileUploaded`
5. Make updates on a feature branch
6. Please create a PR and have one Approval before merging code