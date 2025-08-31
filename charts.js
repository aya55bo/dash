    // Fonctions pour les graphiques
    function updateFournisseurChart(data) {
      if (fournisseurChart) fournisseurChart.destroy();
      
      const entries = Object.entries(data);
      if (entries.length === 0) {
        const ctx = document.getElementById('fournisseurChart').getContext('2d');
        fournisseurChart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ['Aucune donnée'],
            datasets: [{
              data: [1],
              backgroundColor: ['#e9ecef'],
              borderColor: 'white',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
        return;
      }

      const ctx = document.getElementById('fournisseurChart').getContext('2d');
      const colors = ['#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0', '#560bad', '#b5179e'];
      
      fournisseurChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: Object.keys(data),
          datasets: [{
            data: Object.values(data),
            backgroundColor: colors.slice(0, Object.keys(data).length),
            borderColor: 'white',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.label}: ${context.raw.toLocaleString()} MAD`;
                }
              }
            }
          }
        }
      });
    }

    function updateClientChart(data) {
      if (clientChart) clientChart.destroy();
      
      const entries = Object.entries(data);
      if (entries.length === 0) {
        const ctx = document.getElementById('clientChart').getContext('2d');
        clientChart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ['Aucune donnée'],
            datasets: [{
              data: [1],
              backgroundColor: ['#e9ecef'],
              borderColor: 'white',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
        return;
      }

      const ctx = document.getElementById('clientChart').getContext('2d');
      const colors = ['#06ffa5', '#4cc9f0', '#4361ee', '#f72585', '#7209b7', '#560bad', '#b5179e'];
      
      clientChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: Object.keys(data),
          datasets: [{
            data: Object.values(data),
            backgroundColor: colors.slice(0, Object.keys(data).length),
            borderColor: 'white',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.label}: ${context.raw.toLocaleString()} MAD`;
                }
              }
            }
          }
        }
      });
    }

    function updateQualiteChart(data, chartId) {
      
      if (chartId === 'qualiteAchatsChart' && qualiteAchatsChart) {
        qualiteAchatsChart.destroy();
      } else if (chartId === 'qualiteVentesChart' && qualiteVentesChart) {
        qualiteVentesChart.destroy();
      }
      
      const entries = Object.entries(data);
      const ctx = document.getElementById(chartId).getContext('2d');
      
      if (entries.length === 0) {
        const chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Aucune donnée'],
            datasets: [{
              label: "Qualité moyenne",
              data: [0],
              backgroundColor: '#e9ecef'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, max: 10 }
            }
          }
        });
        
        if (chartId === 'qualiteAchatsChart') {
          qualiteAchatsChart = chart;
        } else if (chartId === 'qualiteVentesChart') {
          qualiteVentesChart = chart;
        }
        return;
      }

      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(data),
          datasets: [{
            label: "Qualité moyenne",
            data: Object.keys(data).map(a => data[a].total / data[a].count),
            backgroundColor: '#4cc9f0',
            borderColor: '#4361ee',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { 
              beginAtZero: true, 
              max: 10,
              ticks: {
                callback: function(value) {
                  return value + '/10';
                }
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Qualité: ${context.raw.toFixed(1)}/10`;
                }
              }
            }
          }
        }
      });

      if (chartId === 'qualiteAchatsChart') {
        qualiteAchatsChart = chart;
      } else if (chartId === 'qualiteVentesChart') {
        qualiteVentesChart = chart;
      }
    }

    function updateBudgetVsAchatsChart(data) {
      if (budgetVsAchatsChart) budgetVsAchatsChart.destroy();
      
      const entries = Object.entries(data);
      if (entries.length === 0) {
        const ctx = document.getElementById('budgetVsAchatsChart').getContext('2d');
        budgetVsAchatsChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Aucune donnée'],
            datasets: [
              { label: "Budget alloué", data: [0], backgroundColor: '#e9ecef' },
              { label: "Montant acheté", data: [0], backgroundColor: '#dee2e6' }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
        return;
      }

      const articles = Object.keys(data);
      const budgets = articles.map(a => data[a].budget);
      const achats = articles.map(a => data[a].achats);
      
      const ctx = document.getElementById('budgetVsAchatsChart').getContext('2d');
      budgetVsAchatsChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: articles,
          datasets: [
            { 
              label: "Budget alloué", 
              data: budgets, 
              backgroundColor: '#4361ee',
              borderColor: '#3a0ca3',
              borderWidth: 1
            },
            { 
              label: "Montant acheté", 
              data: achats, 
              backgroundColor: '#f72585',
              borderColor: '#d90429',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.raw.toLocaleString()} MAD`;
                }
              }
            }
          }
        }
      });
    }

    function updateObjectifVsVentesChart(data) {
      if (objectifVsVentesChart) objectifVsVentesChart.destroy();
      
      const entries = Object.entries(data);
      if (entries.length === 0) {
        const ctx = document.getElementById('objectifVsVentesChart').getContext('2d');
        objectifVsVentesChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Aucune donnée'],
            datasets: [
              { label: "Objectif", data: [0], backgroundColor: '#e9ecef' },
              { label: "Ventes réalisées", data: [0], backgroundColor: '#dee2e6' }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
        return;
      }

      const articles = Object.keys(data);
      const objectifs = articles.map(a => data[a].objectif);
      const ventes = articles.map(a => data[a].ventes);
      
      const ctx = document.getElementById('objectifVsVentesChart').getContext('2d');
      objectifVsVentesChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: articles,
          datasets: [
            { 
              label: "Objectif", 
              data: objectifs, 
              backgroundColor: '#06ffa5',
              borderColor: '#02c39a',
              borderWidth: 1
            },
            { 
              label: "Ventes réalisées", 
              data: ventes, 
              backgroundColor: '#7209b7',
              borderColor: '#560bad',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.raw.toLocaleString()} MAD`;
                }
              }
            }
          }
        }
      });
    }

    function updateHistogrammeQualite(data, chartId) {
      
      if (chartId === 'histogrammeQualiteAchats' && histogrammeQualiteAchats) {
        histogrammeQualiteAchats.destroy();
      } else if (chartId === 'histogrammeQualiteVentes' && histogrammeQualiteVentes) {
        histogrammeQualiteVentes.destroy();
      }
      
      const ctx = document.getElementById(chartId).getContext('2d');
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map((_, i) => `${i}/10`),
          datasets: [{
            label: "Nombre d'articles",
            data: data,
            backgroundColor: '#4895ef',
            borderColor: '#4361ee',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { 
              beginAtZero: true,
              ticks: {
                stepSize: 20
              }
            },
            x: {
              title: {
                display: true,
                text: 'Note de qualité'
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.raw} article(s) avec la note ${context.label}`;
                }
              }
            }
          }
        }
      });

      if (chartId === 'histogrammeQualiteAchats') {
        histogrammeQualiteAchats = chart;
      } else if (chartId === 'histogrammeQualiteVentes') {
        histogrammeQualiteVentes = chart;
      }
    }