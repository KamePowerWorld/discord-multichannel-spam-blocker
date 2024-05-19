import { REST, Routes } from "discord.js";
import { commands } from "./commands";

// const commandsData = Object.values(commands).map((command) => command.data);

// export async function deployCommands(clientId: string, rest: REST) {
//   try {
//     console.log(
//       `Started refreshing application ${commandsData.length} (/) commands.`,
//     );

//     await rest.put(Routes.applicationCommands(clientId), {
//       body: commandsData,
//     });

//     console.log(
//       `Successfully reloaded application ${commandsData.length} (/) commands.`,
//     );
//   } catch (error) {
//     console.error(error);
//   }
// }
