import { CompanyKind, ContractType } from '@prisma/client';

// Documentation/response shape for a Company. Mirrors the Prisma model; the
// service returns Prisma's inferred types directly.
export class CompanyEntity {
    id: string;
    kind: CompanyKind;
    name: string;
    localisation: string | null;
    siteUrl: string | null;
    // Large illustration image (« fond ») shown on the public experience card.
    backgroundUrl: string | null;
    // The company's actual logo — used by the standalone timeline app.
    logoUrl: string | null;
    isVisible: boolean;
    order: number;
    contractType: ContractType | null;
    employmentStart: Date | null;
    employmentEnd: Date | null;
    parentEmployerId: string | null;
}
