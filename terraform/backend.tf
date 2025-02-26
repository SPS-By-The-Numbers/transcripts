terraform {
  backend "gcs" {
    bucket = "sps-by-the-numbers-remotestate"
  }
}
