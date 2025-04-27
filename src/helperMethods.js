
export default {

    fetchAndParseTrajectory: async (path, setIsLoading, setError, setTrajectoryData, headersToParse) => {

        // const fetchData = async () => {

            setIsLoading(true);
            setError(null);

            try {

                const response = await fetch(path);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} - Could not fetch ${path}`);
                }
                const csvText = await response.text();

                // Parse CSV
                const lines = csvText.trim().split('\n');

                if (lines.length < 2) {
                    throw new Error('CSV file seems empty or has no data rows.');
                }

                const headers = lines[0].split(',').map(h => h.trim());
                
                let headerIndices = [];

                for (let i = 0; i < headersToParse.length; i++) {

                    headerIndices[i] = headers.indexOf(headersToParse[i]);

                    if (headerIndices[i] === -1) {
                        throw new Error(`CSV must contain ${headersToParse.toString()} columns.`);
                    }
                }

                const parsedData = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const entry = {};
                    // Only parse needed columns for efficiency

                    for (let i = 0; i < headerIndices.length; i++) {
                        
                        entry[headersToParse[i]] = parseFloat(values[headerIndices[i]]);

                        if (isNaN(entry[headersToParse[i]])) {

                            console.warn("Skipping row with invalid number:", line);
                            return null; // Skip rows with invalid numbers
                        }
                    }
                    
                    return entry;

                }).filter(entry => entry !== null); // Remove null entries

                if (parsedData.length === 0) {
                    throw new Error('No valid data rows found after parsing.');
                }

                setTrajectoryData(parsedData);

            } catch (err) {
                console.error("Error loading or parsing trajectory data:", err);
                setError(err.message);
                setTrajectoryData([]); // Clear data on error
            } finally {
                setIsLoading(false);
            }
        // };

        // fetchData();
    },
}