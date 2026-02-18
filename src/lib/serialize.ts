/**
 * Serialization utility for converting non-serializable types to plain objects
 * Handles Prisma Decimal types, Date objects, and recursively processes nested objects and arrays
 */

/**
 * Options for serialization behavior
 */
export interface SerializeOptions {
  convertDates?: boolean; // Convert Date objects to ISO strings
  convertDecimals?: boolean; // Convert Decimal to numbers (default: true)
  excludeFields?: string[]; // Fields to exclude from serialization
}

/**
 * Check if a value is a Decimal type
 * Decimal is instantiated from Prisma, so we check by constructor name or instanceof
 */
function isDecimal(value: any): boolean {
  if (value === null || value === undefined) return false;
  // Check for Decimal.js or Prisma Decimal instances
  return (
    value.constructor?.name === 'Decimal' ||
    (typeof value === 'object' && 'd' in value && 'e' in value && 's' in value)
  );
}

/**
 * Helper function to safely serialize arrays
 * @param arr - Array to serialize
 * @param options - Serialization options
 * @returns Serialized array with non-serializable types converted
 */
function serializeArray<T = any>(
  arr: Array<T | null | undefined>,
  options: SerializeOptions = {}
): Array<any> {
  if (!Array.isArray(arr)) {
    return arr as any;
  }

  // Handle empty arrays gracefully
  if (arr.length === 0) {
    return [];
  }

  return arr.map((item) => {
    // Handle null/undefined items in array
    if (item === null || item === undefined) {
      return item;
    }

    return serializeObject(item, options);
  });
}

/**
 * Recursively serialize an object, converting non-serializable types
 * Handles primitives, objects, arrays, Decimals, and Dates
 * @param obj - Object to serialize (can be any value including arrays, primitives, etc.)
 * @param options - Serialization options
 * @returns Serialized plain object
 * 
 * @example
 * // Convert Decimals to numbers
 * const data = { price: Decimal('19.99'), createdAt: new Date() };
 * const serialized = serializeObject(data);
 * // Result: { price: 19.99, createdAt: new Date() }
 */
export function serializeObject<T = any>(
  obj: T,
  options: SerializeOptions = {}
): T {
  const {
    convertDates = true,
    convertDecimals = true,
    excludeFields = [],
  } = options;

  // Handle null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitives (string, number, boolean, bigint, symbol)
  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle Decimal type (Prisma)
  if (convertDecimals && isDecimal(obj)) {
    return Number(obj) as unknown as T;
  }

  // Handle Date type
  if (convertDates && obj instanceof Date) {
    return obj.toISOString() as unknown as T;
  }

  // Handle Arrays - use dedicated helper for graceful array handling
  if (Array.isArray(obj)) {
    return serializeArray(obj, {
      convertDates,
      convertDecimals,
      excludeFields,
    }) as unknown as T;
  }

  // Handle plain objects
  if (obj.constructor === Object || !obj.constructor) {
    const serialized: any = {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Skip excluded fields
        if (excludeFields.includes(key)) {
          continue;
        }

        const value = (obj as any)[key];
        serialized[key] = serializeObject(value, {
          convertDates,
          convertDecimals,
          excludeFields,
        });
      }
    }

    return serialized as T;
  }

  // For class instances (like Prisma models), try to serialize their properties
  const serialized: any = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (excludeFields.includes(key)) {
        continue;
      }

      const value = (obj as any)[key];
      serialized[key] = serializeObject(value, {
        convertDates,
        convertDecimals,
        excludeFields,
      });
    }
  }

  return serialized as T;
}

/**
 * Serialize an object with Decimal and Date conversions
 * Useful for server→client data transfer
 * Converts both Decimal → number and Date → ISO string for proper serialization
 */
export function serializeForClient<T = any>(obj: T): T {
  return serializeObject(obj, {
    convertDates: true, // Convert Date → ISO string
    convertDecimals: true, // Convert Decimal → number
  });
}

/**
 * Serialize an object with both Decimal and Date conversions
 * Useful for JSON serialization (API responses, etc.)
 */
export function serializeForJSON<T = any>(obj: T): T {
  return serializeObject(obj, {
    convertDates: true, // Convert Date → ISO string
    convertDecimals: true, // Convert Decimal → number
  });
}

/**
 * Serialize specific Decimal fields in an object to numbers
 * @param obj - Object containing Decimal fields
 * @param decimalFields - Array of field names (supports nested paths like "user.profile.height")
 * 
 * @example
 * // Serialize specific fields in an object
 * const patient = { 
 *   id: 1, 
 *   weight: Decimal('75.5'), 
 *   measurements: { height: Decimal('180.2') } 
 * };
 * const result = serializeDecimalFields(patient, ['weight', 'measurements.height']);
 * // Result: { id: 1, weight: 75.5, measurements: { height: 180.2 } }
 */
export function serializeDecimalFields<T extends Record<string, any>>(
  obj: T,
  decimalFields: string[]
): T {
  const serialized = JSON.parse(JSON.stringify(obj)); // Deep clone

  const setNestedValue = (target: any, path: string) => {
    const keys = path.split('.');
    let current = target;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        return;
      }
      current = current[keys[i]];
      
      // Handle null/undefined in path
      if (current === null || current === undefined) {
        return;
      }
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey in current && current[lastKey] !== null && current[lastKey] !== undefined) {
      if (isDecimal(current[lastKey])) {
        current[lastKey] = Number(current[lastKey]);
      }
    }
  };

  for (const field of decimalFields) {
    setNestedValue(serialized, field);
  }

  return serialized;
}

/**
 * Public wrapper to serialize arrays with graceful null/undefined handling
 * @param arr - Array to serialize
 * @param options - Serialization options
 * @returns Serialized array with non-serializable types converted
 * 
 * @example
 * // Serialize array of objects with Decimals and Dates
 * const items = [
 *   { id: 1, price: Decimal('19.99'), createdAt: new Date() },
 *   { id: 2, price: Decimal('29.99'), createdAt: new Date() },
 *   null,  // Gracefully handled
 * ];
 * const serialized = serializeArrayForClient(items);
 * // Result: [
 * //   { id: 1, price: 19.99, createdAt: '2026-02-18T...' },
 * //   { id: 2, price: 29.99, createdAt: '2026-02-18T...' },
 * //   null
 * // ]
 */
export function serializeArrayForClient<T = any>(
  arr: Array<T | null | undefined>
): Array<any> {
  return serializeArray(arr, {
    convertDates: true, // Convert Date → ISO string
    convertDecimals: true, // Convert Decimal → number
  });
}

/**
 * Serialize array for JSON output (converts both Decimals and Dates)
 * @param arr - Array to serialize
 * @returns Serialized array
 */
export function serializeArrayForJSON<T = any>(
  arr: Array<T | null | undefined>
): Array<any> {
  return serializeArray(arr, {
    convertDates: true,
    convertDecimals: true,
  });
}

/**
 * Generic array serialization with custom options
 * @param arr - Array to serialize
 * @param options - Serialization options
 * @returns Serialized array with non-serializable types converted
 */
export function serializeArrayWith<T = any>(
  arr: Array<T | null | undefined>,
  options: SerializeOptions
): Array<any> {
  return serializeArray(arr, options);
}
