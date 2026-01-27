from typing import List
from typing import Optional
from sqlalchemy import ForeignKey
from sqlalchemy import String, Integer
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship
from sqlalchemy import create_engine


class Base(DeclarativeBase):
    pass

class Part(Base):
    __tablename__ = "parts"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(30))
    make: Mapped[str] = mapped_column(String(30))
    model: Mapped[str] = mapped_column(String(30))
    year: Mapped[int] = mapped_column(Integer)
    sku: Mapped[str] = mapped_column(String(30))
    color: Mapped[str] = mapped_column(String(30))
    quality: Mapped[str] = mapped_column(String(30))
    miles: Mapped[int] = mapped_column(Integer)

    # SAMPLE CODE FROM SQLALCHEMY ORM QUICK START GUIDE, USE AS REFERENCE
    # __tablename__ = "user_account"
    # id: Mapped[int] = mapped_column(primary_key=True)
    # name: Mapped[str] = mapped_column(String(30))
    # fullname: Mapped[Optional[str]]
    # addresses: Mapped[List["Address"]] = relationship(
    #     back_populates="user", cascade="all, delete-orphan"
    # )

    # def __repr__(self) -> str:
    #     return f"User(id={self.id!r}, name={self.name!r}, fullname={self.fullname!r})"

# class Address(Base):
#     __tablename__ = "address"
#     id: Mapped[int] = mapped_column(primary_key=True)
#     email_address: Mapped[str]
#     user_id: Mapped[int] = mapped_column(ForeignKey("user_account.id"))
#     user: Mapped["User"] = relationship(back_populates="addresses")
#     def __repr__(self) -> str:
#         return f"Address(id={self.id!r}, email_address={self.email_address!r})"
    
class Interchange(Base):
    __tablename__ = "interchanges"
    id: Mapped[int] = mapped_column(ForeignKey("parts.id"), primary_key = True)
    equivalent: Mapped[List] = 

class Inventory(Base):
    __tablename__ = "inventory"
    id: Mapped[int] = mapped_column(primary_key = True)
    sku: Mapped[int] = mapped_column(Integer)
    location_id: Mapped[str] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(30))



# "<dialect>+<driver>://<username>:<password>@<host>:<port>/<database>"
#  OR "<dialect>+<driver>://<filepath>"
#     dialect = what type of DB software (MYSQL)
#     Driver is optional, as SQLA has a default to use
#     :/// (relative path) or ://// (absolute path)
# echo = True outputs pythons' standard logging info to sys.stdout
#     and when set to "debug", it also outputs query results

engine = create_engine("sqlite://", echo = "debug")
Base.metadata.create_all(engine)