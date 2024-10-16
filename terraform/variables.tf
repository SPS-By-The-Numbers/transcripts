variable "project_id" {
  description = "GCP project for transciption code"
  type = string
}

variable "project_name" {
  description = "GCP Project name for transciption code"
  type = string
}

variable "billing_account" {
  description = "Billing account ID"
  type = string
}

variable "storage_bucket_prefix" {
  description = "Prefix to storage bucket names"
  type = string
}
