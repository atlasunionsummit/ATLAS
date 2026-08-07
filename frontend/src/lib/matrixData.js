export const MATRIX_DATA = {};

export const getMergedMatrixData = (staticData, dynamicCommittees, dynamicPortfolios, dynamicPress) => {
  const merged = { ...staticData };

  // 1. Add any dynamically added committees if they don't exist in staticData
  if (dynamicCommittees) {
    dynamicCommittees.forEach(c => {
      if (!c.name) return;
      // Find case-insensitive match since the keys might slightly differ
      const existingKey = Object.keys(merged).find(k => k.toLowerCase() === c.name.toLowerCase());
      if (!existingKey) {
        merged[c.name] = [];
      }
    });
  }

  // 2. Add dynamic portfolios
  if (dynamicPortfolios) {
    for (const [committee, customList] of Object.entries(dynamicPortfolios)) {
      // Ensure the committee exists in merged data
      let targetCommittee = Object.keys(merged).find(k => k.toLowerCase() === committee.toLowerCase());
      if (!targetCommittee) {
        merged[committee] = [];
        targetCommittee = committee;
      }
      
      const existingCountries = new Set(merged[targetCommittee].map(c => c.country.toLowerCase()));
      for (const custom of customList) {
        if (!existingCountries.has(custom.country.toLowerCase())) {
          merged[targetCommittee].push({ country: custom.country, status: "Open" });
          existingCountries.add(custom.country.toLowerCase());
        }
      }
    }
  }

  // 3. Add dynamic press crew to "International Press"
  if (dynamicPress && dynamicPress.length > 0) {
    if (!merged["International Press"]) merged["International Press"] = [];
    const existingPress = new Set(merged["International Press"].map(p => p.country.toLowerCase()));
    
    dynamicPress.forEach(p => {
      if (!p.role || !p.name) return;
      // Format: "ROLE: NAME" (e.g., "JOURNALIST: John Doe")
      const title = `${p.role.toUpperCase()}: ${p.name}`;
      if (!existingPress.has(title.toLowerCase())) {
        merged["International Press"].push({ country: title, status: "Occupied" }); // Auto-occupied since they are added directly
        existingPress.add(title.toLowerCase());
      }
    });
  }

  return merged;
};
