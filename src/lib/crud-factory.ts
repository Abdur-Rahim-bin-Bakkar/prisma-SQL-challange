type AnyRecord = Record<string, unknown>;

export type PrismaDelegate = {
  create: (args: { data: AnyRecord }) => Promise<AnyRecord>;
  findMany: (args: {
    where?: AnyRecord;
    include?: AnyRecord;
    skip?: number;
    take?: number;
    orderBy?: AnyRecord;
  }) => Promise<AnyRecord[]>;
  findFirst: (args: { where?: AnyRecord; include?: AnyRecord }) => Promise<AnyRecord | null>;
  update: (args: { where: { id: string }; data: AnyRecord }) => Promise<AnyRecord>;
  count: (args: { where?: AnyRecord }) => Promise<number>;
};

type CrudOptions = {
  searchableFields?: string[];
  include?: AnyRecord;
  orderBy?: AnyRecord;
  filter?: (req: AnyRecord) => AnyRecord;
};

export function pick<T extends AnyRecord>(source: AnyRecord, fields: (keyof T)[]): AnyRecord {
  const result: AnyRecord = {};
  for (const field of fields) {
    if (source[field as string] !== undefined) {
      result[field as string] = source[field as string];
    }
  }
  return result;
}

export function createCrudService(delegate: PrismaDelegate, options: CrudOptions = {}) {
  return {
    create: (data: AnyRecord) => delegate.create({ data }),

    getAll: async ({ page, limit, search }: { page?: number; limit?: number; search?: string } = {}) => {
      const pageNum = Math.max(page || 1, 1);
      const limitNum = Math.min(Math.max(limit || 20, 1), 100);

      const where: AnyRecord = { isDeleted: false };

      if (options.filter) {
        Object.assign(where, options.filter);
      }

      if (search && options.searchableFields?.length) {
        where.OR = options.searchableFields.map((field) => ({
          [field]: { contains: search, mode: "insensitive" },
        }));
      }

      const [items, total] = await Promise.all([
        delegate.findMany({
          where,
          include: options.include,
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          orderBy: options.orderBy,
        }),
        delegate.count({ where }),
      ]);

      return {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      };
    },

    getById: (id: string) =>
      delegate.findFirst({ where: { id, isDeleted: false }, include: options.include }),

    update: (id: string, data: AnyRecord) =>
      delegate.update({ where: { id }, data }),

    softDelete: (id: string) =>
      delegate.update({ where: { id }, data: { isDeleted: true } }),
  };
}
