document.addEventListener("DOMContentLoaded", () => {
    const map = L.map("map").setView([-1.286389, 36.817223], 11);

    // Add a base layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    const yearSelect = document.getElementById("yearSelect");
    const quarterSlider = document.getElementById("quarterSlider");
    const quarterLabel = document.getElementById("quarterLabel");

    let greenspaceLayer, carbonLayer, uhiLayer;
    let grPercentChart, crMeanChart, categoryPieChart;
    let grMeanValue, c
    const ctx = document.getElementById("grPercentChart").getContext("2d");
    const ctx2 = document.getElementById("crMeanChart").getContext("2d");
    const ctx3 = document.getElementById("categoryPieChart").getContext("2d");
    const ctx4 = document.getElementById("bubbleChart").getContext("2d");
    let bubbleChart = new Chart(ctx4, {
        type: "bubble",
        data: {
            datasets: []
        },
        options: {
            scales: {
                x: {
                    title: { display: true, text: "Constituencies", color: 'white' },
                    type: "category",  // Ensure x-axis is categorical for constituency names
                    labels: [],  // Initialize empty; labels will be set dynamically
                    ticks: {
                        color: 'white'  // Set color for better visibility
                    }
                },
                y: {
                    title: { display: true, text: "Greenspace Percentage", color: 'white' },
                    beginAtZero: true,
                    ticks: {
                        color: 'white'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            const data = tooltipItem.raw;
                            return `Constituency: ${tooltipItem.label}\nGreenspace: ${data.y.toFixed(2)}%\nUHI Mean (bubble size): ${(data.r * 3).toFixed(2)}\nCarbon Mean: ${data.color}`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });

    function updateLayers(data, selectedYear, selectedQuarter) {
        quarterLabel.textContent = `Q${selectedQuarter}`;

        // Remove previous layers
        if (greenspaceLayer) map.removeLayer(greenspaceLayer);
        if (carbonLayer) map.removeLayer(carbonLayer);
        if (uhiLayer) map.removeLayer(uhiLayer);

        greenspaceLayer = L.tileLayer.wms("http://localhost:8080/geoserver/KAPS/wms", {
            layers: `green_${selectedYear}_q${selectedQuarter}`,
            format: "image/png",
            transparent: true
        }).addTo(map);

        carbonLayer = L.tileLayer.wms("http://localhost:8080/geoserver/KAPS/wms", {
            layers: `carbon_${selectedYear}_q${selectedQuarter}`,
            format: "image/png",
            transparent: true
        });

        uhiLayer = L.tileLayer.wms("http://localhost:8080/geoserver/KAPS/wms", {
            layers: `uhi_${selectedYear}_q${selectedQuarter}`,
            format: "image/png",
            transparent: true
        });

        const overlayMaps = {
            "Greenspace": greenspaceLayer,
            "Carbon": carbonLayer,
            "UHI": uhiLayer
        };

        if (map.layerControl) {
            map.layerControl.remove();
        }
        map.layerControl = L.control.layers(null, overlayMaps).addTo(map);
       // Listen for layer selection changes
    map.on("overlayadd", function (eventLayer) {
        updateLegend(eventLayer.name.toLowerCase(), selectedYear, selectedQuarter);
    });

    map.on("overlayremove", function () {
        updateLegend(); // Clear legend when no layers are visible
    });

    // Initial legend update for the default layer
    updateLegend("greenspace", selectedYear, selectedQuarter);
}

    // Fetch and update legends
    function updateLegend(activeLayer = null, year, quarter) {
        if (map.legendControl) {
            map.legendControl.remove(); // Remove existing legend if present
        }
    
        if (!activeLayer) {
            return; // Exit if no active layer
        }
    
        // Create new Leaflet control for the legend
        map.legendControl = L.control({ position: "bottomleft" });
        map.legendControl.onAdd = function () {
            const div = L.DomUtil.create("div", "legend-container");
            div.innerHTML = `<h4>${activeLayer.charAt(0).toUpperCase() + activeLayer.slice(1)} Legend</h4>`;
    
            const legendUrl = `http://localhost:8080/geoserver/KAPS/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=KAPS:${activeLayer}_${year}_q${quarter}`;
    
            const legendImage = document.createElement("img");
            legendImage.src = legendUrl;
            legendImage.alt = `${activeLayer} Legend`;
    
            div.appendChild(legendImage);
    
            return div;
        };
        map.legendControl.addTo(map);
    }
    

    function updateChart(data, selectedYear) {
        const quarters = ["Q1", "Q2", "Q3", "Q4"];
        const grPercentValues = quarters.map(quarter => data[`${selectedYear}_${quarter}`]?.Mean.GR_PERCENT || 0);

        if (grPercentChart) {
            grPercentChart.destroy();
        }

        grPercentChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: quarters,
                datasets: [{
                    label: `Greenspace Percentage for ${selectedYear}`,
                    data: grPercentValues,
                    backgroundColor: ["#4CAF50", "#66BB6A", "#81C784", "#A5D6A7"],
                }]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'  // Legend text color
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            color: 'white'  // Y-axis tick color
                        },
                        title: {
                            display: true,
                            text: "Percentage",
                            color: 'white'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'white'  // Y-axis tick color
                        },
                        title: {
                            display: true,
                            text: "Quarters",
                            color: 'white'
                        }
                    }
                }
            }
        });
        }


    function updateLineChart(data, selectedYear) {
        const quarters = ["Q1", "Q2", "Q3", "Q4"];
        const crMeanValues = quarters.map(quarter => data[`${selectedYear}_${quarter}`]?.Mean.CARBON_MEAN || 0);

        if (crMeanChart) {
            crMeanChart.destroy();
        }

        crMeanChart = new Chart(ctx2, {
            type: "line",
            data: {
                labels: quarters,
                datasets: [{
                    label: `${selectedYear}`,
                    data: crMeanValues,
                    borderColor: "#FF5252",
                    backgroundColor: "rgba(255, 82, 82, 0.2)",
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'  // Legend text color
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            color: 'white'  // Y-axis tick color
                        },
                        title: {
                            display: true,
                            text: "Carbon Mean",
                            color: 'white'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'white'  // Y-axis tick color
                        },
                        title: {
                            display: true,
                            text: "Quarters",
                            color: 'white'
                        }
                    }
                }
            }
        });

    }

    function updatePieChart(data, selectedYear, selectedQuarter) {
        const categories = ["Low", "Moderate", "High", "Very High"];
        const categoryCounts = categories.map(category => {
            const entry = data.find(item => item.YEAR === `${selectedYear}_Q${selectedQuarter}` && item.Category === category);
            return entry ? parseFloat(entry.Count.replace(/,/g, '')) : 0;
        });
    
        if (categoryPieChart) {
            categoryPieChart.destroy();
        }
    
        const total = categoryCounts.reduce((sum, value) => sum + value, 0);
    
        categoryPieChart = new Chart(ctx3, {
            type: "pie",
            data: {
                labels: categories,
                datasets: [{
                    data: categoryCounts,
                    backgroundColor: ["#4CAF50", "#FFC107", "#FF5722", "#D32F2F"],
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `UHFVI for ${selectedYear} Q${selectedQuarter}`, // Dynamic title
                        color: 'white', // Title color
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(tooltipItem) {
                                const value = tooltipItem.raw;
                                const percentage = ((value / total) * 100).toFixed(2);
                                return `${tooltipItem.label}: ${percentage}%`;
                            }
                        }
                    },
                    legend: {
                        position: 'right',
                        labels: {
                            color: 'white',
                             // Legend text color
                        }
                    }
                }
            }
        });

    }

    function updateMeans(data, selectedYear, selectedQuarter) {
        const greenspaceMean = data[`${selectedYear}_Q${selectedQuarter}`]?.Mean.GR_PERCENT || 0;
        const carbonMean = data[`${selectedYear}_Q${selectedQuarter}`]?.Mean.CARBON_MEAN || 0;
        const uhiMean = data[`${selectedYear}_Q${selectedQuarter}`]?.Mean.LST_MEAN || 0;
    
        document.getElementById("grMeanValue").textContent =  greenspaceMean.toFixed(2) + "%";
        document.getElementById("crMeanValue").textContent = carbonMean.toFixed(3);
        document.getElementById("lstMeanValue").textContent =  uhiMean.toFixed(2) + "°C";
    }


    // Fetching data
fetch("/data/KAPS_DATA.json")
.then(response => response.json())
.then(data => {
    jsonData = data;
    updateBubbleChart(data, "2019", "Q1"); // Initial default update
})
.catch(error => console.error("Error loading JSON data:", error));

function getColorForCarbon(carbonMean) {
// Assign color based on carbonMean value
if (carbonMean < 0.0255) return 'rgba(255, 204, 204, 1)';
else if (carbonMean < 0.0260) return 'rgba(255, 153, 153, 1)';
else if (carbonMean < 0.0265) return 'rgba(255, 102, 102, 1)';
else if (carbonMean < 0.0270) return 'rgba(255, 51, 51, 1)';
else if (carbonMean < 0.0275) return 'rgba(204, 0, 0, 1)';
else return 'rgba(153, 0, 0, 1)';
}

function updateBubbleChart(data, selectedYear, selectedQuarter) {
if (!data) return;

const dataKey = `${selectedYear}_Q${selectedQuarter}`;
const dataForQuarter = data[dataKey];
if (!dataForQuarter) return; // Exit if no data for this year/quarter

// Extract constituencies and map to chart data points
const constituencies = Object.keys(dataForQuarter).filter(key => key !== "Mean"); // Exclude "Mean" if present

const chartData = constituencies.map((constituency) => {
    const values = dataForQuarter[constituency];
    return {
        x: constituency,                     // x-axis constituency name
        y: values.GR_PERCENT,                // y-axis as greenspace percentage
        r: values.LST_MEAN / 3,              // Bubble size based on LST_MEAN
        backgroundColor: getColorForCarbon(values.CARBON_MEAN) // Color based on CARBON_MEAN
    };
});

// Update chart data and labels
bubbleChart.data.datasets = [{
    label: `${selectedYear} ${selectedQuarter}`,
    data: chartData.map(dataPoint => ({
        x: dataPoint.x,
        y: dataPoint.y,
        r: dataPoint.r,
    })),
    backgroundColor: chartData.map(dataPoint => dataPoint.backgroundColor),
    hoverBackgroundColor: chartData.map(dataPoint => dataPoint.backgroundColor),
}];
bubbleChart.options.scales.x.labels = constituencies;
bubbleChart.update();
}

// Example usage on year/quarter change
yearSelect.addEventListener("change", () => {
    const selectedYear = yearSelect.value;
    const selectedQuarter = `Q${quarterSlider.value}`;
    updateBubbleChart(jsonData, selectedYear, selectedQuarter);
});

quarterSlider.addEventListener("input", () => {
    const selectedYear = yearSelect.value;
    const selectedQuarter = `Q${quarterSlider.value}`;
    updateBubbleChart(jsonData, selectedYear, selectedQuarter);
});
    
    
    
    

    fetch("/data/KAPS_DATA.json")
        .then(response => response.json())
        .then(data => {
            const availableYears = Object.keys(data).map(key => key.split('_')[0]).filter((value, index, self) => self.indexOf(value) === index);
            availableYears.forEach(year => {
                const option = document.createElement("option");
                option.value = year;
                option.text = year;
                yearSelect.add(option);
            });

            yearSelect.addEventListener("change", () => {
                const selectedYear = yearSelect.value;
                const selectedQuarter = quarterSlider.value;
                updateChart(data, selectedYear);
                updateLineChart(data, selectedYear);
                updateLayers(data, selectedYear, selectedQuarter);
                updateMeans(data, selectedYear, selectedQuarter);
                updateBubbleChart(data, selectedYear, selectedQuarter);
            });

            quarterSlider.addEventListener("input", () => {
                const selectedYear = yearSelect.value;
                const selectedQuarter = quarterSlider.value;
                quarterLabel.textContent = `Q${selectedQuarter}`;
                updateLayers(data, selectedYear, selectedQuarter);
                updateMeans(data, selectedYear, selectedQuarter);
                updateBubbleChart(data, selectedYear, selectedQuarter);
            });
        })
        .catch(error => console.error("Error loading JSON data:", error));

    fetch("/data/UHFVI.json")
        .then(response => response.json())
        .then(categoryData => {
            yearSelect.addEventListener("change", () => {
                const selectedYear = yearSelect.value;
                const selectedQuarter = quarterSlider.value;
                updatePieChart(categoryData, selectedYear, selectedQuarter);
            });
            quarterSlider.addEventListener("input", () => {
                const selectedYear = yearSelect.value;
                const selectedQuarter = quarterSlider.value;
                updatePieChart(categoryData, selectedYear, selectedQuarter);
            });
        })
        .catch(error => console.error("Error loading category JSON data:", error));

    // Set default values and trigger initial update
    yearSelect.value = "2019";
    quarterSlider.value = 1;
    fetch("/data/KAPS_DATA.json").then(response => response.json()).then(data => {
        updateChart(data, "2019");
        updateLineChart(data, "2019");
        updateLayers(data, "2019", 1)
        updatePieChart(data, "2019", 1);
        updateMeans(data, "2019", 1)
        updateBubbleChart(data, "2019", 1)
    });

    fetch("/data/UHFVI.json").then(response => response.json()).then(data => {
        updatePieChart(data, "2019", 1)
        updateMeans(data, "2019", 1)
    })
});

