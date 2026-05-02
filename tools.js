import {tool} from "langchain";
import * as z from "zod";

export const retrieve = tool(
    async ({ query }) => {
        console.log("🔧 now searching the document store")
        const relevantDocs = await vectorStore.similaritySearch(query, 2)
        const context = relevantDocs.map(doc => doc.pageContent).join("\n\n")
        return context
    },
    {
        name: "retrieve",
        description: "retrieve context data out of documents",
        schema: z.object ({
            city: z.string().describe("documentdata")
        })
    },
);

export const getTrip = tool(
    async ({ from, to }) => {
        console.log("🔧 NS reisinfo tool wordt uitgevoerd!");

        try {
            const url = `https://gateway.apiportal.ns.nl/reisinformatie-api/api/v3/trips?fromStation=${encodeURIComponent(from)}&toStation=${encodeURIComponent(to)}`;

            const response = await fetch(url, {
                headers: {
                    "Ocp-Apim-Subscription-Key": process.env.NS_API_KEY
                }
            });

            const data = await response.json();

            if (!data.trips || data.trips.length === 0) {
                return `Geen reis gevonden van ${from} naar ${to}.`;
            }

            const trip = data.trips[0];
            const legs = trip.legs;

            const stappen = legs.map((leg, index) => {
                const vertrekTijd = new Date(leg.origin.plannedDateTime).toLocaleTimeString("nl-NL", {
                    hour: "2-digit",
                    minute: "2-digit"
                });

                const aankomstTijd = new Date(leg.destination.plannedDateTime).toLocaleTimeString("nl-NL", {
                    hour: "2-digit",
                    minute: "2-digit"
                });

                const van = leg.origin.name;
                const naar = leg.destination.name;
                const trein = leg.product?.displayName || "trein";
                const spoor = leg.origin.actualTrack || leg.origin.plannedTrack || "?";

                return `${index + 1}. Neem de ${trein} van ${van} (spoor ${spoor}) om ${vertrekTijd} naar ${naar}. Aankomst om ${aankomstTijd}.`;
            });

            return `Je reis van ${from} naar ${to}:\n\n${stappen.join("\n")}`;

        } catch (e) {
            console.error(e);
            return "Er ging iets mis bij het ophalen van de reisinformatie.";
        }
    },
    {
        name: "get_trip",
        description: "Haalt een treinreis op inclusief overstappen en stappen",
        schema: z.object({
            from: z.string().describe("Vertrekstation"),
            to: z.string().describe("Bestemmingsstation")
        })
    }
);
export const getDepartures = tool(
    async ({ station }) => {
        console.log("🔧 NS vertrektijden tool wordt uitgevoerd!");

        try {
            const stationUrl = `https://gateway.apiportal.ns.nl/nsapp-stations/v2?q=${encodeURIComponent(station)}&limit=1`;

            const stationResponse = await fetch(stationUrl, {
                headers: {
                    "Ocp-Apim-Subscription-Key": process.env.NS_API_KEY
                }
            });

            const stationData = await stationResponse.json();

            if (!stationResponse.ok || !stationData.payload || stationData.payload.length === 0) {
                return `Ik kon station "${station}" niet vinden.`;
            }

            const stationCode = stationData.payload[0].code;

            const departuresUrl = `https://gateway.apiportal.ns.nl/reisinformatie-api/api/v2/departures?station=${encodeURIComponent(stationCode)}&maxJourneys=5`;

            const departuresResponse = await fetch(departuresUrl, {
                headers: {
                    "Ocp-Apim-Subscription-Key": process.env.NS_API_KEY
                }
            });

            const departuresData = await departuresResponse.json();

            if (!departuresResponse.ok) {
                console.log(departuresData);
                return `Ik kon geen vertrektijden ophalen voor ${station}.`;
            }

            if (!departuresData.payload?.departures?.length) {
                return `Geen vertrektijden gevonden voor ${station}.`;
            }

            const result = departuresData.payload.departures.map(dep => {
                const tijd = new Date(dep.plannedDateTime).toLocaleTimeString("nl-NL", {
                    hour: "2-digit",
                    minute: "2-digit"
                });

                const bestemming = dep.direction || "onbekende bestemming";
                const spoor = dep.actualTrack || dep.plannedTrack || "?";
                const trein = dep.product?.longCategoryName || dep.product?.shortCategoryName || "Trein";

                return `${tijd} → ${bestemming} met ${trein} vanaf spoor ${spoor}`;
            });

            return `Vertrektijden voor ${station}:\n${result.join("\n")}`;

        } catch (e) {
            console.error(e);
            return "Er ging iets mis bij het ophalen van de vertrektijden.";
        }
    },
    {
        name: "get_departures",
        description: "Haalt actuele vertrektijden op voor een opgegeven station in Nederland.",
        schema: z.object({
            station: z.string().describe("Stationsnaam")
        })
    }
);

export const getDate = tool(
    () => {
        const today = new Date();
        const readableDate = today.toLocaleDateString("nl-NL", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        console.log(`🔧 date tool wordt uitgevoerd!`);
        return readableDate;
    },
    {
        name: "get_date",
        description: "Get the current date in a readable Dutch format",
        schema: z.object({})
    }
);

// export const getWeather = tool(
//     ({ city }) => {
//         console.log(`🔧 de weather tool wordt uitgevoerd!`)
//         return `It's always sunny in ${city}!`
//     },
//     {
//         name: "get_weather",
//         description: "Get the weather for a given city",
//         schema: z.object ({
//             city: z.string().describe("City to look up the weather")
//         })
//     },
// );
//
// export const rollDice = tool(
//     ({ sides }) => {
//         console.log(`🔧 Ik rol een ${sides}-zijdige dobbelsteen!`);
//         return Math.floor(Math.random() * sides) + 1;
//     },
//     {
//         name: "roll_dice",
//         description: "Roll a dice with a given number of sides",
//         schema: z.object({
//             sides: z.number().describe("Aantal zijden van de dobbelsteen")
//         })
//     }
// );


// schema: {
//     type: "object",
//         properties: {
//         city: { type: "string" },
//     },
//     required: ["city"],
// },