from sqlalchemy import MetaData, Column, Integer, String, create_engine, ForeignKey
from sqlalchemy.orm import declarative_base, Mapped, mapped_column, relationship


### CONNECTION TO DB ##################################################################

# create_engine arg template
# "<dialect>+<driver>://<username>:<password>@<host>:<port>/<database>"
#  OR "<dialect>+<driver>://<filepath>"
#     dialect = what type of DB software (MYSQL)
#     Driver is optional, as SQLA has a default to use
#     :/// (relative path) or ://// (absolute path)
# echo = True outputs pythons' standard logging info to sys.stdout
#     and when set to "debug", it also outputs query results

engine = create_engine("mysql:///AutoTraQ_DB.db")

Base = declarative_base()
conn = engine.connect()
metadata = MetaData()

# ALTERNATE ENGINE CREATION IF WE HOST DB ON A WEBSITE
# url_object = URL.create(
#     "postgresql+pg8000", 
#     username="dbuser",
#     password="kx@jj5/g",  # plain (unescaped) text
#     host="pghost10",
#     database="appdb",
# )
#
# engine = create_engine(url_object)
# engine.connect()


### parts TABLE ###############################################################################

# Each part to be loaded in as an object, which can use methods like self.id, for example

class Part(Base):
    __tablename__ = "parts",
    Base.metadata,
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(30))
    make: Mapped[str] = mapped_column(String(30))
    model: Mapped[str] = mapped_column(String(30))
    year: Mapped[int] = mapped_column(Integer)
    color: Mapped[str] = mapped_column(String(30))
    SKU: Mapped[str] = mapped_column(String(30))
    quality: Mapped[str] = mapped_column(String(30))
    miles: Mapped[int] = mapped_column(Integer)