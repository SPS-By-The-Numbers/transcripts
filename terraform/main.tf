resource "google_project" "sps_by_the_numbers" {
  name = var.project_name
  project_id = var.project_id
  billing_account = var.billing_account
  deletion_policy = "PREVENT"
}

resource "google_storage_bucket" "cloudbuild" {
  name = "${var.storage_bucket_prefix}_cloudbuild"
  location = "us"
  project = var.project_id

  force_destroy = false
}

resource "google_storage_bucket" "datastore" {
  name = "${var.storage_bucket_prefix}.appspot.com"
  location = "us-west2"
  project = var.project_id

  force_destroy = false
}

