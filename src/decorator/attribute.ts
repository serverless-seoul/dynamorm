import { Attribute as AttributeMetadata } from "../metadata";
import { ITable, Table } from "../table";

// Table Decorator
export function Attribute(options: { name?: string; timeToLive?: true; __type?: any } = {}) {
  return (record: Table, propertyName: string) => {
    const tableClass = (record.constructor as ITable<any>);

    // __type is injected by the dynamorm transformer at compile time.
    // Falls back to Reflect.getMetadata for legacy setups using emitDecoratorMetadata.
    const R = Reflect as any;
    const nativeType = options.__type
      ?? (typeof R.getMetadata === "function"
        ? R.getMetadata("design:type", record, propertyName)
        : undefined);

    if (nativeType === undefined) {
      throw new Error(
        `Cannot determine type for property "${propertyName}". ` +
        `Use the dynamorm transformer plugin in your tsconfig.json, ` +
        `or enable emitDecoratorMetadata with reflect-metadata.`
      );
    }

    tableClass.metadata.attributes.push(
      {
        name: options.name || propertyName,
        propertyName,
        timeToLive: options.timeToLive,
        type: _nativeTypeToAttributeMetadataType(nativeType),
      }
    );
  };
}

function _nativeTypeToAttributeMetadataType(nativeType: any) {
  if (nativeType === String) {
    return AttributeMetadata.Type.String;
  } else if (nativeType === Number) {
    return AttributeMetadata.Type.Number;
  } else if (nativeType === Boolean) {
    return AttributeMetadata.Type.Boolean;
  } else if (nativeType === Array) {
    return AttributeMetadata.Type.Array;
  } else if (nativeType === Object) {
    return AttributeMetadata.Type.Map;
  } else {
    throw new Error(`Unsupported type ${nativeType}`);
  }
}
