using System;
using System.IO;
using System.Text;

namespace ClearEPCData {
    internal class Program {
        static void Main() {

            Option[] options = {
                new Option("SQLite database (epc.db)", () => {
                    string dbPath = "data/epc.db";
                    if (File.Exists(dbPath)) {
                        File.Delete(dbPath);
                        Console.ForegroundColor = ConsoleColor.Green;
                        Console.WriteLine("Successfully deleted epc.db (will be recreated on next load)");
                    } else {
                        Console.ForegroundColor = ConsoleColor.Yellow;
                        Console.WriteLine("epc.db not found - nothing to reset");
                    }
                    Console.ResetColor();
                }),
                new Option("Legacy shift.json", () => {
                    File.WriteAllText("data/shift.json", "{\"currentShift\":null,\"shifts\":[]}");
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("Successfully reset shift.json");
                    Console.ResetColor();
                }),
                new Option("Legacy court.json & peds.json", () => {
                    File.WriteAllText("data/court.json", "[]");
                    File.WriteAllText("data/peds.json", "[]");
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("Successfully reset court.json & peds.json");
                    Console.ResetColor();
                })
            };

            Console.CursorVisible = false;
            Console.OutputEncoding = Encoding.UTF8;

            Console.WriteLine("Use \u2191 and \u2193 to navigate and press \u21b5 Enter to select the file(s) you want to reset.\n");

            int selection = 0;
            bool inOptionMenu = true;

            int cursorTop = Console.CursorTop;
            int cursorLeft = Console.CursorLeft;
            ConsoleKeyInfo key;

            while (inOptionMenu) {
                Console.SetCursorPosition(cursorLeft, cursorTop);

                foreach (Option option in options) {
                    Console.WriteLine($"{(selection == Array.IndexOf(options, option) ? "\u001b[38;2;255;0;144m\u2713" : " ")} {option.File}\u001b[0m");
                }

                key = Console.ReadKey(false);

                switch (key.Key) {
                    case ConsoleKey.UpArrow:
                        selection = selection == 0 ? options.Length - 1 : selection - 1;
                        break;

                    case ConsoleKey.DownArrow:
                        selection = selection == options.Length - 1 ? 0 : selection + 1;
                        break;

                    case ConsoleKey.Enter:
                        inOptionMenu = false;
                        break;
                }
            }
            Console.WriteLine("");
            try {
                options[selection].Callback();
            } catch {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("An Error occured! Tf did you do? Follow the damn instructions! (Sorry jk, if you need support ask on Discord: https://discord.gg/RW9uy3spVb)");
                Console.ResetColor();
            }
            Console.WriteLine("Press \u21b5 Enter to exit");
            Console.ReadLine();
        }
    }

    class Option {
        public string File;
        public Action Callback;
        public Option(string file, Action cb) {
            File = file;
            Callback = cb;
        }
    }

}
