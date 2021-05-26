locals {
  deploy_pretix = terraform.workspace == "production"
}

# Applications

module "pretix" {
  source = "./pretix"
  count  = local.deploy_pretix ? 1 : 0

  database_password = var.database_password
  mail_user         = var.mail_user
  mail_password     = var.mail_password
  secret_key        = var.pretix_secret_key
  sentry_dsn        = var.pretix_sentry_dsn
  ssl_certificate   = var.ssl_certificate
}

module "pycon_backend" {
  source = "./pycon_backend"

  database_password                = var.database_password
  secret_key                       = var.secret_key
  mapbox_public_api_key            = var.mapbox_public_api_key
  sentry_dsn                       = var.sentry_dsn
  slack_incoming_webhook_url       = var.slack_incoming_webhook_url
  social_auth_google_oauth2_key    = var.social_auth_google_oauth2_key
  social_auth_google_oauth2_secret = var.social_auth_google_oauth2_secret
  pretix_api_token                 = var.pretix_api_token
  pinpoint_application_id          = var.pinpoint_application_id
  ssl_certificate                  = var.ssl_certificate
  pastaporto_secret                = var.pastaporto_secret
}

module "gateway" {
  source = "./gateway"

  pastaporto_secret         = var.pastaporto_secret
  identity_secret           = var.identity_secret
  service_to_service_secret = var.service_to_service_secret
  pastaporto_action_secret  = var.pastaporto_action_secret
  sentry_dsn                = var.gateway_sentry_dsn
  apollo_key                = var.apollo_key

  providers = {
    aws    = aws
    aws.us = aws.us
  }
}

module "admin_gateway" {
  source = "./gateway"

  pastaporto_secret         = var.pastaporto_secret
  identity_secret           = var.identity_secret
  service_to_service_secret = var.service_to_service_secret
  pastaporto_action_secret  = var.pastaporto_action_secret
  admin_variant             = true
  sentry_dsn                = var.gateway_sentry_dsn
  apollo_key                = var.apollo_key

  providers = {
    aws    = aws
    aws.us = aws.us
  }
}

module "users_backend" {
  source = "./users_backend"

  secret_key                = var.users_backend_secret_key
  google_auth_client_id     = var.social_auth_google_oauth2_key
  google_auth_client_secret = var.social_auth_google_oauth2_secret
  database_password         = var.database_password
  pastaporto_secret         = var.pastaporto_secret
  identity_secret           = var.identity_secret
  service_to_service_secret = var.service_to_service_secret
  pastaporto_action_secret  = var.pastaporto_action_secret
  sentry_dsn                = var.users_backend_sentry_dsn

  depends_on = [module.database]
}

module "association_backend" {
  source = "./association_backend"

  database_password            = var.database_password
  pastaporto_secret            = var.pastaporto_secret
  stripe_secret_api_key        = var.stripe_secret_api_key
  stripe_subscription_price_id = var.association_backend_stripe_membership_price_id
  stripe_webhook_secret        = var.association_backend_stripe_webhook_secret
  sentry_dsn                   = var.association_backend_sentry_dsn

  depends_on = [module.database]
}

module "email_templates" {
  source = "./email_templates"
}

# Other resources

module "database" {
  source = "./database"

  database_password = var.database_password
}
