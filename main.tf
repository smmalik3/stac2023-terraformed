terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

resource "aws_iam_role" "lambda_role" {
  name = "lambda_exec_role"

  assume_role_policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [
      {
        Action    = "sts:AssumeRole",
        Effect    = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_s3_bucket" "resumeuploads4" {
  bucket = "resumeuploads4"
}

# DO NOT DELETE
# resource "aws_s3_bucket_policy" "bucket_policy" {
#   bucket = "resumeuploads4"

#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Principal = "*"
#         Action = [
#           "s3:GetObject",
#           "s3:PutObject"
#         ]
#         Resource = "arn:aws:s3:::resumeuploads4/*"
#       }
#     ]
#   })
# }

resource "aws_iam_role_policy_attachment" "lambda_textract_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonTextractFullAccess"
  role       = aws_iam_role.lambda_role.name
}

data "aws_iam_policy_document" "textract_lambda_policy" {
  statement {
    effect = "Allow"
    actions = [
      "textract:DetectDocumentText"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "textract_lambda_policy" {
  name   = "textract-lambda-policy"
  policy = data.aws_iam_policy_document.textract_lambda_policy.json
}

resource "aws_iam_role_policy_attachment" "textract_lambda_attachment" {
  policy_arn = aws_iam_policy.textract_lambda_policy.id
  role       = aws_iam_role.lambda_role.id
}

resource "aws_iam_role_policy_attachment" "s3_fullaccess_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
  role       = aws_iam_role.lambda_role.name
}

resource "aws_iam_role_policy_attachment" "lambda_logs_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

resource "aws_lambda_function" "fileUploaded" {
  filename      = "fileUploaded.zip"
  function_name = "fileUploaded"
  role          = aws_iam_role.lambda_role.arn
  handler       = "fileUploaded/handler.readS3File"
  source_code_hash = filebase64sha256("fileUploaded.zip")
  runtime       = "nodejs14.x"
  timeout = 300  // Update the timeout value to 300 seconds (5 minutes)
  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.resumeuploads4.id
      OPENAI_API_KEY = var.OPENAI_API_KEY
    }
  }
  depends_on = [
    aws_iam_role_policy_attachment.lambda_logs_policy,
    aws_iam_role_policy_attachment.lambda_textract_policy
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
      "logs:PutLogEvents"
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

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.resumeuploads4.bucket

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
  source_arn    = aws_s3_bucket.resumeuploads4.arn
}

resource "aws_lambda_permission" "allow_textract_invoke" {
  statement_id    = "AllowTextractInvoke"
  action          = "lambda:InvokeFunction"
  function_name   = aws_lambda_function.fileUploaded.arn
  principal       = "textract.amazonaws.com"
  source_account  = "690711176673"  # Update with your AWS account ID
  source_arn      = "arn:aws:textract:us-east-1:690711176673:document-understanding-pipeline/*"
}
