//! A [mod@clap] based module to produce a CLI app
//!
//! Gets enabled by `cli` feature
//! struct, enums that use `clap` derive macro to produce CLI commands, argument
//! and options while underlying functions handle each scenario

use std::path::PathBuf;
use clap::{Parser, Subcommand, command};

mod compose;
mod rainconfig;

pub use compose::*;
pub use rainconfig::*;

/// CLI app entrypoint sruct
#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    compose: DotrainCompose,
}

/// Compose
#[derive(Subcommand)]
pub enum Dotrain {
    /// Compose a .rain file to rainlang
    #[command(subcommand)]
    Compose(Compose),
}

/// Subcommand entry point
#[derive(Parser, Debug)]
#[command(author, version, about = "Rain composer CLI binary to compose .rain files to rainlang", long_about = None)]
pub struct Compose {
    /// Input .rain file path
    #[arg(short, long)]
    input: PathBuf,
    /// Entrypoints
    #[arg(short, long)]
    entrypoints: Vec<String>,
    /// Path to the rainconfig json file that contains configurations,
    /// if provided will be used to when composing the .rain, see
    /// './example.rainconfig.json' for more details.
    #[arg(short, long)]
    config: Option<PathBuf>,
    /// Force compile by ignoring all erroneous paths/contents specified in rainconfig
    #[arg(short, long)]
    force: Option<bool>,
    /// Only use local dotrain meta specified in rainconfig include field and dont search for them in subgraphs
    #[arg(short, long)]
    local_data_only: Option<bool>,
    #[command(subcommand)]
    subcmd: Option<SubCommands>,
}

/// Top level commands
#[derive(Subcommand, Debug)]
pub enum SubCommands {
    /// Prints 'rainconfig' info and description
    #[command(subcommand)]
    RainconfigInfo(RainconfigInfo),
}

/// rainconfig available commands
#[derive(Subcommand, Debug)]
pub enum RainconfigInfo {
    /// Prints general info about rainconfig
    Info,
    /// Prints all known rainconfig field names
    PrintAll,
    /// Prints info about 'include' field
    Include,
    /// Prints info about 'subgraphs' field
    Subgraphs,
}

/// Dispatches the CLI call based on the given options and commands
pub async fn dispatch(cli: RainComposerCli) -> anyhow::Result<()> {
    if let Some(subcmd) = cli.subcmd {
        match subcmd {
            SubCommands::RainconfigInfo(v) => match v {
                RainconfigInfo::Info => println!("{}", rainconfig::RAINCONFIG_DESCRIPTION),
                RainconfigInfo::PrintAll => println!("{}", ["- include", "- subgraphs"].join("\n")),
                RainconfigInfo::Include => {
                    println!("{}", rainconfig::RAINCONFIG_INCLUDE_DESCRIPTION)
                }
                RainconfigInfo::Subgraphs => {
                    println!("{}", rainconfig::RAINCONFIG_SUBGRAPHS_DESCRIPTION)
                }
            },
        }
    } else {
        println!("{}", compose_target(cli).await?);
    };
    Ok(())
}

pub async fn main() -> anyhow::Result<()> {
    tracing::subscriber::set_global_default(tracing_subscriber::fmt::Subscriber::new())?;
    let cli = Cli::parse();
    dispatch(cli.compose).await
}
