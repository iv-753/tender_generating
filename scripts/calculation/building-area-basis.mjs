// Storage without a basis uses the historic per-floor convention.
export function toBuildingTotalProject(project) {
  if (project.stairAreaBasis === 'per-building') return project;
  return { ...project, stairAreaBasis: 'per-building', buildings: project.buildings.map(b => ({ ...b,
    evacuationStairArea: b.evacuationStairArea == null || !(b.buildingCount > 0 && b.totalFloors > 0)
      ? b.evacuationStairArea : b.evacuationStairArea * b.totalFloors / b.buildingCount,
  })) };
}

export function toPerFloorProject(project) {
  if (project.stairAreaBasis !== 'per-building') return project;
  return { ...project, stairAreaBasis: 'per-floor', buildings: project.buildings.map((b, i) => {
    if (b.evacuationStairArea > 0 && !(b.buildingCount > 0 && b.totalFloors > 0)) {
      throw new Error(`第${i + 1}组有楼梯面积，请填写大于0的楼栋数和本组楼层总数`);
    }
    return { ...b, evacuationStairArea: b.evacuationStairArea == null || b.evacuationStairArea === 0
      ? b.evacuationStairArea : b.evacuationStairArea * b.buildingCount / b.totalFloors };
  }) };
}
