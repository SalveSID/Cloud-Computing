provider "google" {
  credentials = file("./csci5409k8sassignment-d3c8f1ae8108.json")
  project     = "csci5409k8sassignment"
  region      = "us-central1"
}

resource "google_container_cluster" "primary" {
  name               = "sidk8scluster1"
  location           = "us-central1-b"
  remove_default_node_pool = true
	initial_node_count       = 1
}

resource "google_container_node_pool" "primary_nodes" {
		name = "sidk8snode"
		location = "us-central1-b"
		cluster = google_container_cluster.primary.name
		node_count = 1

  node_config {
      machine_type = "e2-medium"
      disk_size_gb = 10
      disk_type    = "pd-standard"
      image_type   = "COS_CONTAINERD"
   }
}

resource "null_resource" "config-update" {
  depends_on = [google_container_cluster.primary]

  provisioner "local-exec" {
    command = "gcloud container clusters get-credentials sidk8scluster1 --region=us-central1-b"
  }
}

resource "null_resource" "apply" {
  depends_on = [null_resource.config-update]

  provisioner "local-exec" {
    command = "kubectl apply -f k8s-store.yml"
    working_dir = path.module
    }
}