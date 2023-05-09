terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

resource "aws_s3_bucket" "resumeuploads3" {
  bucket = "resumeuploads3"
}

resource "aws_lambda_function" "fileUploaded" {
  filename      = "fileUploaded.zip"
  function_name = "fileUploaded"
  role          = aws_iam_role.lambda_role.arn
  handler       = "handler.readS3File"
  source_code_hash = filebase64sha256("fileUploaded.zip")
  runtime       = "nodejs14.x"
  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.resumeuploads3.bucket
      OPENAI_API_KEY = var.OPENAI_API_KEY
    }
  }
  depends_on = [
    aws_iam_role_policy_attachment.lambda_logs_policy
  ]
}

# This is to optionally manage the CloudWatch Log Group for the Lambda Function.
# If skipping this resource configuration, also add "logs:CreateLogGroup" to the IAM policy below.
resource "aws_cloudwatch_log_group" "example" {
  name              = "/aws/lambda/fileUploaded"
  retention_in_days = 14
}

# See also the following AWS managed policy: AWSLambdaBasicExecutionRole
data "aws_iam_policy_document" "lambda_logging" {
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_policy" "lambda_logging" {
  name        = "lambda_logging"
  path        = "/"
  description = "IAM policy for logging from a lambda"
  policy      = data.aws_iam_policy_document.lambda_logging.json
}

resource "aws_iam_role_policy_attachment" "lambda_logs_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.resumeuploads3.bucket

  lambda_function {
    lambda_function_arn = aws_lambda_function.fileUploaded.arn
    events              = ["s3:ObjectCreated:*"]
  }
}

resource "aws_lambda_permission" "s3_permission" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fileUploaded.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.resumeuploads3.arn
}

resource "aws_iam_role" "lambda_role" {
  name = "lambda_execution_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}