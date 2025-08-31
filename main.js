   // Var globales
    let rows = [];
    let fournisseurChart, qualiteAchatsChart, qualiteVentesChart, budgetVsAchatsChart, clientChart, objectifVsVentesChart, histogrammeQualiteAchats, histogrammeQualiteVentes;

    // Fonction pour basculer entre les sections
    function showSection(section) {
        // Cacher toutes les sections
      document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      
      // Afficher la section sélectionnée
      document.getElementById(section + '-section').classList.add('active');
      event.target.classList.add('active');
    }

    // Gestion du chargement de fichier
    document.getElementById('input-excel').addEventListener('change', handleFile);

    function handleFile(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });

        const headers = jsonData[0].map(h => h.toString().toLowerCase().trim());
        rows = jsonData.slice(1).map(r => {
          let obj = {};
          headers.forEach((h, i) => obj[h] = r[i] !== undefined ? r[i] : '');
          return obj;
        });

        appliquerFiltres(headers);
      };
      reader.readAsArrayBuffer(file);
    }

    //  "Appliquer les filtres"
    document.getElementById('applyFilters').addEventListener('click', () => {
      if (rows.length > 0) {
        const headers = Object.keys(rows[0]);
        appliquerFiltres(headers);
      } else {
        document.getElementById('input-excel').click();
      }
    });

    //convertir une date Excel en objet Date
    function excelDateToJSDate(serial) {
      if (serial instanceof Date) return serial;
      
      if (typeof serial === 'number') {
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        
        const fractional_day = serial - Math.floor(serial) + 0.0000001;
        let total_seconds = Math.floor(86400 * fractional_day);
        
        const seconds = total_seconds % 60;
        total_seconds -= seconds;
        
        const hours = Math.floor(total_seconds / (60 * 60));
        const minutes = Math.floor(total_seconds / 60) % 60;
        
        return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
      }
      
      if (typeof serial === 'string') {
        const dateFormats = [
          new Date(serial),
          new Date(serial.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')),
          new Date(serial.replace(/(\d{4})-(\d{2})-(\d{2})/, '$2/$3/$1')),
        ];
        
        for (let date of dateFormats) {
          if (!isNaN(date.getTime())) return date;
        }
      }
      
      return new Date(NaN);
    }

    // Application des filtres et préparation des données
    function appliquerFiltres(headers) {
      const dateDebut = document.getElementById('date-debut').value ? new Date(document.getElementById('date-debut').value) : null;
      const dateFin = document.getElementById('date-fin').value ? new Date(document.getElementById('date-fin').value) : null;
      
      if (dateFin) {
        dateFin.setHours(23, 59, 59, 999);
      }

      // Colonnes
      const colType = headers.find(h => h.includes("type")) || headers.find(h => h.includes("operation")) || "type";
      const colArticle = headers.find(h => h.includes("article") || h.includes("produit")) || "article";
      const colFournisseur = headers.find(h => h.includes("fournisseur") || h.includes("client") || h.includes("partenaire")) || "fournisseur";
      const colPrixU = headers.find(h => h.includes("prix")) || "prix";
      const colTotal = headers.find(h => h.includes("total") || h.includes("montant")) || "total";
      const colStatut = headers.find(h => h.includes("statut") || h.includes("status")) || "statut";
      const colQualite = headers.find(h => h.includes("qualite") || h.includes("quality")) || "qualite";
      const colBudget = headers.find(h => h.includes("budget") || h.includes("objectif")) || "budget";
      const colDate = headers.find(h => h.includes("date")) || "date";

      let totalAchatsOk = 0, totalVentesOk = 0;
      let uniqueArticlesAchats = new Set(), uniqueArticlesVentes = new Set();
      let uniqueFournisseurs = new Set(), uniqueClients = new Set();
      let budgetVsAchatData = {}, objectifVsVenteData = {};

      // Données pour la qualité séparées par type
      let qualiteDataAchats = {}, qualiteDataVentes = {};
      let qualiteDistribAchats = Array(11).fill(0);
      let qualiteDistribVentes = Array(11).fill(0);

      let bestPricesAchat = {}, bestPricesVente = {};

      // Données pour les graphiques
      let achatsOkParFournisseur = {}, ventesOkParClient = {};
      let aggFournisseurs = {}, aggClients = {};

      rows.forEach(row => {
        // Vérifier si la ligne est dans la plage de dates
        if (dateDebut || dateFin) {
          const rowDate = excelDateToJSDate(row[colDate]);
          
          if (!isNaN(rowDate.getTime())) {
            if (dateDebut && rowDate < dateDebut) return;
            if (dateFin && rowDate > dateFin) return;
          }
        }

        let type = (row[colType] || '').toString().toLowerCase().trim();
        let article = (row[colArticle] || '').toString().trim();
        let partenaire = (row[colFournisseur] || '').toString().trim();
        let prixU = parseFloat((row[colPrixU] || '0').toString().replace(/[^\d.-]/g, "")) || 0;
        let total = parseFloat((row[colTotal] || '0').toString().replace(/[^\d.-]/g, "")) || 0;
        let statut = (row[colStatut] || '').toString().toLowerCase().trim();
        let qualite = parseInt((row[colQualite] || '0').toString().replace(/[^\d]/g, "")) || 0;
        let budgetObjectif = parseFloat((row[colBudget] || '0').toString().replace(/[^\d.-]/g, "")) || 0;

        // Vérifier si le statut est OK
        const isStatusOk = statut === "ok" || statut === "success" || statut === "validé";

        if (type.includes("achat") || type === "achat" || type === "purchase") {
          // Total achats uniquement pour les lignes avec statut OK
          if (isStatusOk) {
            totalAchatsOk += total;
          }
          
          if (article) uniqueArticlesAchats.add(article);
          if (partenaire) uniqueFournisseurs.add(partenaire);

          // Budget vs Achats (seulement pour les lignes OK)
          if (article && budgetObjectif > 0) {
            if (!budgetVsAchatData[article]) budgetVsAchatData[article] = { budget: budgetObjectif, achats: 0 };
            if (isStatusOk) {
              budgetVsAchatData[article].achats += total;
            }
          }

          // Meilleurs prix achats
          if (isStatusOk && article && prixU > 0) {
            if (!bestPricesAchat[article] || prixU < bestPricesAchat[article].prix) {
              bestPricesAchat[article] = { partenaire, prix: prixU, qualite };
            }
          }

          // Répartition des achats par fournisseur (OK uniquement)
          if (isStatusOk && partenaire) {
            achatsOkParFournisseur[partenaire] = (achatsOkParFournisseur[partenaire] || 0) + total;
          }

          // Qualité par article (ACHATS UNIQUEMENT)
          if (article && qualite > 0) {
            if (!qualiteDataAchats[article]) qualiteDataAchats[article] = { total: 0, count: 0 };
            qualiteDataAchats[article].total += qualite;
            qualiteDataAchats[article].count++;
            if (qualite >= 0 && qualite <= 10) qualiteDistribAchats[qualite]++;
          }

          // Agrégats fournisseurs
          if (partenaire) {
            if (!aggFournisseurs[partenaire]) {
              aggFournisseurs[partenaire] = { 
                volumeOkMAD: 0, lignesAchats: 0, lignesOk: 0, 
                qualiteSum: 0, qualiteCount: 0
              };
            }
            const agg = aggFournisseurs[partenaire];
            agg.lignesAchats++;
            if (!Number.isNaN(qualite) && qualite > 0) {
              agg.qualiteSum += qualite;
              agg.qualiteCount++;
            }
            if (isStatusOk) {
              agg.lignesOk++;
              agg.volumeOkMAD += total;
            }
          }
        }
        
        if (type.includes("vente") || type === "vente" || type === "sale") {
          // Total ventes uniquement pour les lignes avec statut OK
          if (isStatusOk) {
            totalVentesOk += total;
          }
          
          if (article) uniqueArticlesVentes.add(article);
          if (partenaire) uniqueClients.add(partenaire);

          // Objectif vs Ventes (seulement pour les lignes OK)
          if (article && budgetObjectif > 0) {
            if (!objectifVsVenteData[article]) objectifVsVenteData[article] = { objectif: budgetObjectif, ventes: 0 };
            if (isStatusOk) {
              objectifVsVenteData[article].ventes += total;
            }
          }

          // Meilleurs prix ventes
          if (isStatusOk && article && prixU > 0) {
            if (!bestPricesVente[article] || prixU > bestPricesVente[article].prix) {
              bestPricesVente[article] = { partenaire, prix: prixU, qualite };
            }
          }

          // Répartition des ventes par client (OK uniquement)
          if (isStatusOk && partenaire) {
            ventesOkParClient[partenaire] = (ventesOkParClient[partenaire] || 0) + total;
          }

          // Qualité par article (VENTES UNIQUEMENT)
          if (article && qualite > 0) {
            if (!qualiteDataVentes[article]) qualiteDataVentes[article] = { total: 0, count: 0 };
            qualiteDataVentes[article].total += qualite;
            qualiteDataVentes[article].count++;
            if (qualite >= 0 && qualite <= 10) qualiteDistribVentes[qualite]++;
          }

          // Agrégats clients
          if (partenaire) {
            if (!aggClients[partenaire]) {
              aggClients[partenaire] = { 
                volumeOkMAD: 0, lignesVentes: 0, lignesOk: 0, 
                qualiteSum: 0, qualiteCount: 0
              };
            }
            const agg = aggClients[partenaire];
            agg.lignesVentes++;
            if (!Number.isNaN(qualite) && qualite > 0) {
              agg.qualiteSum += qualite;
              agg.qualiteCount++;
            }
            if (isStatusOk) {
              agg.lignesOk++;
              agg.volumeOkMAD += total;
            }
          }
        }
      });

      // Mise à jour des KPIs (maintenant avec les totaux OK uniquement)
      document.getElementById("totalAchats").textContent = totalAchatsOk.toLocaleString();
      document.getElementById("totalVentes").textContent = totalVentesOk.toLocaleString();
      document.getElementById("nombreArticlesAchats").textContent = uniqueArticlesAchats.size;
      document.getElementById("nombreArticlesVentes").textContent = uniqueArticlesVentes.size;
      document.getElementById("nombreFournisseurs").textContent = uniqueFournisseurs.size;
      document.getElementById("nombreClients").textContent = uniqueClients.size;

      // Mise à jour des tableaux
      updateBestPriceTable(bestPricesAchat, "bestPriceTable", "Fournisseur");
      updateBestPriceTable(bestPricesVente, "bestSalePriceTable", "Client");
      updateTopFournisseursTable(aggFournisseurs);
      updateTopClientsTable(aggClients);

      // Mise à jour des graphiques
      updateFournisseurChart(achatsOkParFournisseur);
      updateClientChart(ventesOkParClient);
      updateQualiteChart(qualiteDataAchats, "qualiteAchatsChart");
      updateQualiteChart(qualiteDataVentes, "qualiteVentesChart");
      updateBudgetVsAchatsChart(budgetVsAchatData);
      updateObjectifVsVentesChart(objectifVsVenteData);
      updateHistogrammeQualite(qualiteDistribAchats, "histogrammeQualiteAchats");
      updateHistogrammeQualite(qualiteDistribVentes, "histogrammeQualiteVentes");
    }

    // Fonctions pour les tableaux
    function updateBestPriceTable(data, tableId, partenaireLabel) {
      const tbody = document.querySelector(`#${tableId} tbody`);
      if (!tbody) return;
      
      const entries = Object.keys(data);
      if (entries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Aucune donnée disponible</td></tr>';
        return;
      }
      
      tbody.innerHTML = entries.map(article => {
        const item = data[article];
        return `<tr>
          <td>${article}</td>
          <td>${item.partenaire}</td>
          <td>${item.prix.toFixed(2)} MAD</td>
          <td>${item.qualite}/10</td>
        </tr>`;
      }).join("");
    }

    function updateTopFournisseursTable(data) {
      const tbody = document.querySelector("#topFournisseursTable tbody");
      if (!tbody) return;

      const entries = Object.entries(data);
      if (entries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Aucune donnée disponible</td></tr>';
        return;
      }

      const rows = entries.map(([fournisseur, stats]) => {
        const otd = stats.lignesAchats > 0 ? (stats.lignesOk / stats.lignesAchats) * 100 : 0;
        const qualiteMoy = stats.qualiteCount > 0 ? (stats.qualiteSum / stats.qualiteCount) : 0;
        const qualitePct = qualiteMoy * 10;

        return { 
          fournisseur, 
          volumeMAD: stats.volumeOkMAD, 
          otd, 
          qualitePct,
          score: stats.volumeOkMAD * (otd / 100) * (qualitePct / 100)
        };
      })
      .filter(r => r.volumeMAD > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

      tbody.innerHTML = rows.map(r => `
        <tr>
          <td>${r.fournisseur}</td>
          <td>${Math.round(r.volumeMAD).toLocaleString()} MAD</td>
          
          <td>${r.qualitePct.toFixed(1)}%</td>
        </tr>
      `).join("");
    }

    function updateTopClientsTable(data) {
      const tbody = document.querySelector("#topClientsTable tbody");
      if (!tbody) return;

      const entries = Object.entries(data);
      if (entries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Aucune donnée disponible</td></tr>';
        return;
      }

      const rows = entries.map(([client, stats]) => {
        const tauxReussite = stats.lignesVentes > 0 ? (stats.lignesOk / stats.lignesVentes) * 100 : 0;
        const qualiteMoy = stats.qualiteCount > 0 ? (stats.qualiteSum / stats.qualiteCount) : 0;
        const qualitePct = qualiteMoy * 10;

        return { 
          client, 
          volumeMAD: stats.volumeOkMAD, 
          tauxReussite, 
          qualitePct 
        };
      })
      .filter(r => r.volumeMAD > 0)
      .sort((a, b) => b.volumeMAD - a.volumeMAD)
      .slice(0, 5);

      tbody.innerHTML = rows.map(r => `
        <tr>
          <td>${r.client}</td>
          <td>${Math.round(r.volumeMAD).toLocaleString()} MAD</td>
          
          <td>${r.qualitePct.toFixed(1)}%</td>
        </tr>
      `).join("");
    }
