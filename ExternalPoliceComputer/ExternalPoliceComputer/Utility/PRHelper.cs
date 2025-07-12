using ExternalPoliceComputer.Data;
using ExternalPoliceComputer.Data.Reports;
using ExternalPoliceComputer.Setup;
using PolicingRedefined.Interaction.Assets.PedAttributes;
using Rage;
using System.Linq;


namespace ExternalPoliceComputer.Utility {
    internal class PRHelper {
        internal static void GiveCitation(CitationReport citationReport) {
            EPCPedData pedData = DataController.PedDatabase.FirstOrDefault(x => x.Name == citationReport.OffenderPedName);
            if (pedData == null) return;
            Ped ped = pedData.Holder;
            if (ped == null || !ped.IsValid()) return;
            foreach (CitationReport.Charge charge in citationReport.Charges) {
                Citation citation = new Citation(ped, charge.name, charge.maxFine, SetupController.GetLanguage().units.currencySymbol, SetupController.GetConfig().displayCurrencySymbolBeforeNumber, charge.isArrestable);
                PolicingRedefined.API.PedAPI.GiveCitationToPed(ped, citation);
            }
        }
    }
}
