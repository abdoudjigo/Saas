variable "aws_region" {
  description = "AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "shadow_mode" {
  description = "Activate shadow infrastructure"
  type        = bool
  default     = false
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDRs"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "shadow_subnet_cidrs" {
  description = "Shadow subnet CIDRs (isolated)"
  type        = list(string)
  default     = ["10.0.254.0/24", "10.0.253.0/24"]
}

variable "enable_gpu" {
  description = "Enable GPU node groups"
  type        = bool
  default     = false
}

variable "gpu_node_groups" {
  description = "GPU node group configuration"
  type        = map(any)
  default     = {
    gpu_spot = {
      instance_type = "g4dn.xlarge"
      min_size      = 0
      max_size      = 2
    }
  }
}

variable "encrypt_kms_key" {
  description = "KMS key ARN for encryption"
  type        = string
  default     = null
}

variable "ip_whitelist" {
  description = "IPs allowed to access public resources"
  type        = list(string)
  default     = []
}

variable "shadow_access_key" {
  description = "Access key for shadow resources"
  type        = string
  sensitive   = true
  default     = null
}

variable "bastion_ssh_key" {
  description = "SSH public key for bastion access"
  type        = string
  default     = ""
}

variable "shadow_ssh_key" {
  description = "SSH public key for shadow access"
  type        = string
  sensitive   = true
  default     = ""
}

variable "whitelisted_ips" {
  description = "IPs allowed to SSH to bastion"
  type        = list(string)
  default     = []
}

variable "emergency_access_cidr" {
  description = "CIDR block for emergency SSH access"
  type        = string
  default     = ""
}

variable "shadow_metrics" {
  description = "Enable shadow performance metrics"
  type        = bool
  default     = false
}

variable "alert_email" {
  description = "Email for standard alerts"
  type        = string
  default     = ""
}

variable "shadow_alert_email" {
  description = "Email for shadow alerts"
  type        = string
  sensitive   = true
  default     = ""
}