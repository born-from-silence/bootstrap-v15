import click
from . import __version__

@click.group()
@click.version_option(version=__version__)
def cli():
    """My CLI - Descrição do seu comando."""
    pass

@cli.command()
@click.argument('name', default='World')
def hello(name):
    """Diz olá para alguém."""
    click.echo(f"Olá, {name}!")

if __name__ == '__main__':
    cli()