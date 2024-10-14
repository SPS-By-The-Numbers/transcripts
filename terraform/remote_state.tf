resource "google_storage_bucket" "tf_remotestate" {
  name = "${var.storage_bucket_prefix}-remotestate"
  location = "US"
  project = var.project_id

  force_destroy = false
  public_access_prevention = "enforced"
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }
}

resource "local_file" "default" {
  file_permission = "0644"
  filename        = "${path.module}/backend.tf"

  # You can store the template in a file and use the templatefile function for
  # more modularity, if you prefer, instead of storing the template inline as
  # we do here.
  content = <<-EOT
  terraform {
    backend "gcs" {
      bucket = "${google_storage_bucket.tf_remotestate.name}"
    }
  }
  EOT
}
