async function loadCSV(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  const text = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors && results.errors.length) {
          console.warn("CSV parse warnings:", results.errors);
        }

        const rows = (results.data || []).filter((row) =>
          Object.values(row).some((value) => String(value ?? "").trim() !== "")
        );

        resolve(rows);
      },
      error: (err) => reject(err)
    });
  });
}
