using System.Collections.Generic;
using PolicingRedefined.Interaction.Assets.PedAttributes;
using Rage;

namespace ExternalPoliceComputer {
    internal class PedCitations {
        internal Dictionary<string, (int count, int totalFineAmount, bool isArrestable)> citations;
        
        internal PedCitations() {
            citations = new Dictionary<string, (int count, int totalFineAmount, bool isArrestable)>();
        }

        internal void AddCitation(string citation, int fineAmount, bool isArrestable) {
            if (citations.ContainsKey(citation)) {
                citations[citation] = (citations[citation].count + 1, citations[citation].totalFineAmount + fineAmount, citations[citation].isArrestable || isArrestable);
            }
            else citations.Add(citation, (1, fineAmount, isArrestable));
        }

        internal void Clear() {
            citations.Clear();
        }

        internal void TransferCitations(Ped ped) {
            foreach (var citation in citations) {
                string citationText = citation.Value.count > 1 ? $"{citation.Key} - x{citation.Value.count}" : citation.Key;
                Citation c = new Citation(ped, $"{citationText}", citation.Value.totalFineAmount, citation.Value.isArrestable);
                PolicingRedefined.API.PedAPI.GiveCitationToPed(ped, c);
            }
        }
    }
}