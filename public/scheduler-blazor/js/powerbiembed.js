window.PowerBI = {
    showReport: function (reportContainer, accessToken, embedUrl, embedReportId, pageName, dotnetReference) {
        var mobileView = window.innerWidth < 768;

        // Get models. models contains enums that can be used.
        var models = window['powerbi-client'].models;

        // Embed configuration used to describe the what and how to embed.
        // This object is used when calling powerbi.embed.
        // This also includes settings and options such as filters.
        // You can find more information at
        // https://bit.ly/3vZO703
        var config = {
            type: 'report',
            tokenType: models.TokenType.Embed,
            accessToken: accessToken,
            embedUrl: embedUrl,
            id: embedReportId,
            permissions: models.Permissions.All,
            settings: {
                bars: {
                    statusBar: {
                        visible: true
                    }
                },
                filterPaneEnabled: true,
                navContentPaneEnabled: true,
                layoutType: mobileView ? models.LayoutType.MobilePortrait : models.LayoutType.Custom,
                customLayout: {
                    displayOption: models.DisplayOption.FitToPage,
                },
                background: models.BackgroundType.Transparent,
                commands: [
                    {
                        insightsAnalysis: {
                            displayOption: models.CommandDisplayOption.Hidden,
                        }
                    }
                ]
            }
    };

        // Don't add a page name if blank, will get default page automatically
        if (pageName) {
            config.pageName = pageName;
        }
        // Store a reference to the report for changing page
        if (!window.reports) {
            window.reports = {}
        }

        // Embed the report and display it within the div container.
        window.reports[embedReportId] = powerbi.embed(reportContainer, config);

        // Send page data back to .NET
        if (mobileView) {
            window.reports[embedReportId].on("rendered", e => {
                window.reports[embedReportId].getPages().then(x => {
                    dotnetReference.invokeMethodAsync('SetPageNames', x.map(x => x.displayName), x.map(x => x.name));
                })

                window.reports[embedReportId].getActivePage().then(page => {
                    dotnetReference.invokeMethodAsync('SetCurrentPage', page.name)
                });
            });
        }
    },
    switchReportPage: function (embedReportId, pageName) {
        window.reports[embedReportId].setPage(pageName);
    },
    showDashboard: function (dashboardContainer, accessToken, embedUrl, embedDashboardId) {
        var mobileView = window.innerWidth < 768;

        // Get models. models contains enums that can be used.
        var models = window['powerbi-client'].models;

        // Embed configuration used to describe the what and how to embed.
        // This object is used when calling powerbi.embed.
        // This also includes settings and options such as filters.
        // You can find more information at
        // https://bit.ly/3vZO703
        var config = {
            type: 'dashboard',
            tokenType: models.TokenType.Embed,
            accessToken: accessToken,
            embedUrl: embedUrl,
            id: embedDashboardId,
            permissions: models.Permissions.All,
            settings: {
                filterPaneEnabled: true,
                navContentPaneEnabled: true,
                layoutType: !mobileView ? models.LayoutType.MobilePortrait : models.LayoutType.MobileLandscape,
                customLayout: {
                    displayOption: models.DisplayOption.FitToPage,
                }
            }
        };

        // Embed the report and display it within the div container.
        powerbi.embed(dashboardContainer, config);
    },
    editReport: function (reportContainer, accessToken, embedUrl, embedReportId) {
        var mobileView = window.innerWidth < 768;

        // Get models. models contains enums that can be used.
        var models = window['powerbi-client'].models;

        // Embed configuration used to describe the what and how to embed.
        // This object is used when calling powerbi.embed.
        // This also includes settings and options such as filters.
        // You can find more information at
        // https://bit.ly/3vZO703
        var config = {
            type: 'report',
            tokenType: models.TokenType.Embed,
            accessToken: accessToken,
            embedUrl: embedUrl,
            id: embedReportId,
            permissions: models.Permissions.All,
            viewMode: models.ViewMode.Edit,
            settings: {
                filterPaneEnabled: true,
                navContentPaneEnabled: true,
                commands: [
                    {
                        insightsAnalysis: {
                            displayOption: models.CommandDisplayOption.Hidden,
                        }
                    }
                ]
            }
        };
        //if (mobileView) config.settings.layoutType = models.LayoutType.MobilePortrait;

        // Embed the report and display it within the div container.
        powerbi.embed(reportContainer, config);
    },
    printReport: function (reportContainer, embedReportId) {
        var element = $(reportContainer)[0];
        var report = powerbi.get(element);
        if (report) {
            report.print();
        } else {
            console.error("Report not found with ID:", embedReportId);
        }
    },
    fullScreenReport: function (reportContainer, embedReportId) {
        var element = $(reportContainer)[0];
        var report = powerbi.get(element);
        if (report) {
            report.fullscreen();
        } else {
            console.error("Report not found with ID:", embedReportId);
        }
    },
    reloadReport: function (reportContainer, embedReportId) {
        var element = $(reportContainer)[0];
        var report = powerbi.get(element);
        if (report) {
            report.reload();
        } else {
            console.error("Report not found with ID:", embedReportId);
        }
    },
    refreshReport: function (reportContainer, embedReportId) {
        var element = $(reportContainer)[0];
        var report = powerbi.get(element);
        if (report) {
            report.refresh();
        } else {
            console.error("Report not found with ID:", embedReportId);
        }
    },
    createReport: function (reportContainer, accessToken, embedUrl, datasetId) {
        var mobileView = window.innerWidth < 768;

        // Get models. models contains enums that can be used.
        var models = window['powerbi-client'].models;

        // Embed configuration used to describe the what and how to embed.
        // This object is used when calling powerbi.embed.
        // This also includes settings and options such as filters.
        // You can find more information at
        // https://bit.ly/3vZO703
        // https://bit.ly/3wVBUuB
        var config = {
            tokenType: models.TokenType.Embed,
            accessToken: accessToken,
            embedUrl: embedUrl,
            datasetId: datasetId,
            settings: {
                filterPaneEnabled: true,
                navContentPaneEnabled: true,
                customLayout: {
                    displayOption: models.DisplayOption.FitToPage,
                }
            }
        };

        // Create report
        powerbi.createReport(reportContainer, config);
    }
};
window.downloadFileFromStream = (fileName, fileContent) => {
    const blob = new Blob([new Uint8Array(fileContent)], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}