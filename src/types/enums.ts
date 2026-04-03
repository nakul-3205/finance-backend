// These enum values mirror exactly what `prisma generate` outputs from schema.prisma.
// On your machine, after running `npx prisma generate`, you can optionally swap
// these imports back to `@prisma/client` — both are equivalent.

export enum Role {
  VIEWER   = 'VIEWER',
  ANALYST  = 'ANALYST',
  ADMIN    = 'ADMIN',
}

export enum Status {
  ACTIVE   = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum RecordType {
  INCOME  = 'INCOME',
  EXPENSE = 'EXPENSE',
}
