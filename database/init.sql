create table utilisateurs
(
    id_utilisateur     uuid                     default uuid_generate_v4() not null
        primary key,
    nom                varchar(255)                                        not null,
    prenom             varchar(255)                                        not null,
    mail               varchar(255)                                        not null
        unique,
    password           varchar(255)                                        not null,
    role               varchar(50)              default 'user'::character varying,
    notification       boolean                  default false,
    langue             varchar(10)              default 'fr'::character varying,
    date_naissance     date                                                not null,
    created_at         timestamp with time zone default CURRENT_TIMESTAMP,
    updated_at         timestamp with time zone default CURRENT_TIMESTAMP,
    email_verified     boolean                  default false              not null,
    verification_token varchar(255),
    token_expires      timestamp
);

alter table utilisateurs
    owner to postgres;

create trigger update_utilisateurs_timestamp
    before update
    on utilisateurs
    for each row
execute procedure update_timestamp();

create table restaurants
(
    id              serial
        primary key,
    user_id         uuid         not null
        references utilisateurs
            on delete cascade,
    restaurant_name varchar(255) not null,
    restaurant_type varchar(100) not null,
    address         varchar(255) not null,
    contact         varchar(100) not null,
    description     text,
    verification    varchar(50)              default 'pending'::character varying,
    created_at      timestamp with time zone default CURRENT_TIMESTAMP,
    updated_at      timestamp with time zone default CURRENT_TIMESTAMP
);

alter table restaurants
    owner to postgres;

create trigger update_restaurants_timestamp
    before update
    on restaurants
    for each row
execute procedure update_timestamp();

create table restaurant_settings
(
    id            serial
        primary key,
    restaurant_id integer not null
        references restaurants
            on delete cascade,
    currency      varchar(3)               default 'USD'::character varying,
    tax_rate      numeric(5, 3)            default 0.0,
    created_at    timestamp with time zone default CURRENT_TIMESTAMP,
    updated_at    timestamp with time zone default CURRENT_TIMESTAMP
);

alter table restaurant_settings
    owner to postgres;

create trigger update_restaurant_settings_timestamp
    before update
    on restaurant_settings
    for each row
execute procedure update_timestamp();

create table restaurant_hours
(
    id            serial
        primary key,
    restaurant_id integer     not null
        references restaurants
            on delete cascade,
    day_of_week   varchar(10) not null,
    is_open       boolean                  default false,
    created_at    timestamp with time zone default CURRENT_TIMESTAMP,
    updated_at    timestamp with time zone default CURRENT_TIMESTAMP,
    unique (restaurant_id, day_of_week)
);

alter table restaurant_hours
    owner to postgres;

create trigger update_restaurant_hours_timestamp
    before update
    on restaurant_hours
    for each row
execute procedure update_timestamp();

create table restaurant_shifts
(
    id                  serial
        primary key,
    restaurant_hours_id integer not null
        references restaurant_hours
            on delete cascade,
    shift_name          varchar(50)              default 'Main'::character varying,
    open_time           time    not null,
    close_time          time    not null,
    created_at          timestamp with time zone default CURRENT_TIMESTAMP,
    updated_at          timestamp with time zone default CURRENT_TIMESTAMP
);

alter table restaurant_shifts
    owner to postgres;

create trigger update_restaurant_shifts_timestamp
    before update
    on restaurant_shifts
    for each row
execute procedure update_timestamp();

create table restaurant_tables
(
    id            serial
        primary key,
    restaurant_id integer     not null
        references restaurants
            on delete cascade,
    table_number  varchar(20) not null,
    capacity      integer     not null,
    location      varchar(100),
    status        varchar(50)              default 'available'::character varying,
    created_at    timestamp with time zone default CURRENT_TIMESTAMP,
    updated_at    timestamp with time zone default CURRENT_TIMESTAMP
);

alter table restaurant_tables
    owner to postgres;

create trigger update_restaurant_tables_timestamp
    before update
    on restaurant_tables
    for each row
execute procedure update_timestamp();

create table interets
(
    id_interet     uuid                     default uuid_generate_v4() not null
        primary key,
    id_utilisateur uuid                                                not null
        references utilisateurs
            on delete cascade,
    nom_interet    varchar(255)                                        not null,
    created_at     timestamp with time zone default CURRENT_TIMESTAMP,
    updated_at     timestamp with time zone default CURRENT_TIMESTAMP
);

alter table interets
    owner to postgres;

create trigger update_interets_timestamp
    before update
    on interets
    for each row
execute procedure update_timestamp();

create table restaurant_reservations
(
    id               serial
        primary key,
    restaurant_id    integer      not null
        references restaurants
            on delete cascade,
    table_id         integer
        references restaurant_tables,
    customer_name    varchar(255) not null,
    customer_email   varchar(255),
    customer_phone   varchar(100) not null,
    party_size       integer      not null,
    reservation_date date         not null,
    reservation_time time         not null,
    end_time         time         not null,
    status           varchar(50)              default 'confirmed'::character varying,
    special_requests text,
    created_at       timestamp with time zone default CURRENT_TIMESTAMP,
    updated_at       timestamp with time zone default CURRENT_TIMESTAMP
);

alter table restaurant_reservations
    owner to postgres;

create trigger update_restaurant_reservations_timestamp
    before update
    on restaurant_reservations
    for each row
execute procedure update_timestamp();

create table restaurant_images
(
    id            serial
        primary key,
    restaurant_id integer      not null
        unique
        references restaurants
            on delete cascade,
    filename      varchar(255) not null,
    created_at    timestamp default CURRENT_TIMESTAMP
);

alter table restaurant_images
    owner to postgres;

