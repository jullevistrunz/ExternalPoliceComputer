using System.Collections.Generic;
using System.Reflection;
using PolicingRedefined.Interaction.Assets.PedAttributes;
using Rage;

namespace ExternalPoliceComputer
{
    internal class Citations
    {
        internal Dictionary<string, (int count, int totalFineAmount, bool isArrestable)> citations;
        
        internal Citations()
        {
            citations = new Dictionary<string, (int count, int totalFineAmount, bool isArrestable)>();
        }

        internal void AddCitation(string citation, int fineAmount, bool isArrestable)
        {
            if (citations.ContainsKey(citation))
            {
                citations[citation] = (citations[citation].count + 1, citations[citation].totalFineAmount + fineAmount, isArrestable);
            } 
            else citations.Add(citation, (1, fineAmount, isArrestable));
        }

        internal static void Clear()
        {
            Citations.Clear();
        }

        internal void TransferCitations(Ped ped)
        {
            foreach (var citation in citations)
            {
                Citation c = new Citation(ped, $"{citation.Key} - x{citation.Value.count}", citation.Value.totalFineAmount, citation.Value.isArrestable);
                PolicingRedefined.API.PedAPI.GiveCitationToPed(ped, c);
            }
        }

    }
}