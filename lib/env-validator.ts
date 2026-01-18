/**
 * Environment variable validation utility
 * Ensures all required environment variables are set and are strings
 */

interface EnvConfig {
  name: string;
  required: boolean;
  description: string;
}

const ENV_VARS: EnvConfig[] = [
  {
    name: "DATABASE_URL",
    required: true,
    description: "PostgreSQL connection string",
  },
  {
    name: "SESSION_SECRET",
    required: true,
    description: "Secret key for session cookies",
  },
  {
    name: "DATA_ENCRYPTION_KEY",
    required: true,
    description: "Encryption key for sensitive data",
  },
  {
    name: "NODE_ENV",
    required: false,
    description: "Application environment (development/production)",
  },
];

/**
 * Validates that all required environment variables are set and are strings
 * @throws Error if validation fails
 */
export function validateEnvironment(): void {
  const errors: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];

    if (envVar.required && !value) {
      errors.push(`Missing required environment variable: ${envVar.name} (${envVar.description})`);
      continue;
    }

    if (value !== undefined && typeof value !== "string") {
      errors.push(
        `Environment variable ${envVar.name} must be a string, but received ${typeof value}. ` +
        `This may be caused by improper secret configuration in your deployment platform.`
      );
    }

    // Additional validation for specific variables
    if (envVar.name === "DATABASE_URL" && value) {
      if (!value.startsWith("postgresql://") && !value.startsWith("postgres://")) {
        errors.push(`DATABASE_URL must be a valid PostgreSQL connection string (got: ${value.substring(0, 20)}...)`);
      }
    }

    if (envVar.name === "DATA_ENCRYPTION_KEY" && value) {
      if (value.length !== 64 || !/^[a-fA-F0-9]+$/.test(value)) {
        console.warn(
          `Warning: DATA_ENCRYPTION_KEY should be a 64-character hex string. ` +
          `Current length: ${value.length}. The key will be hashed to ensure proper length.`
        );
      }
    }
  }

  if (errors.length > 0) {
    const errorMessage = [
      "Environment validation failed:",
      ...errors.map((err) => `  - ${err}`),
      "",
      "Please check your environment configuration and ensure all required variables are set as strings.",
    ].join("\n");

    throw new Error(errorMessage);
  }

  console.log("✓ Environment validation passed");
}

/**
 * Sanitizes environment variables to ensure they are strings
 * This is a fallback for platforms that may pass env vars as objects
 */
export function sanitizeEnvironment(): void {
  // List of env vars that should definitely be strings
  const stringEnvVars = [
    "DATABASE_URL",
    "SESSION_SECRET", 
    "DATA_ENCRYPTION_KEY",
    "PGHOST",
    "PGPORT",
    "PGUSER",
    "PGPASSWORD",
    "PGDATABASE",
  ];

  for (const varName of stringEnvVars) {
    const value = process.env[varName];
    if (value !== undefined && typeof value !== "string") {
      console.warn(`Converting ${varName} from ${typeof value} to string`);
      process.env[varName] = String(value);
    }
  }
}
