-- Starter reward catalogue, so the scanner and the customer portal have
-- something real to render on day one. Points are tuned against the default
-- rate of ₡1.000 = 1 punto: a free coffee at 10 puntos is roughly ₡10.000 of
-- purchases, which is about a week of daily visits.

insert into public.rewards (name, description, points_cost, member_only, sort_order) values
  ('Café del día gratis',   'Un café del día de cualquier tamaño.',                    10, false, 1),
  ('Bebida especial',       'Latte, cappuccino o cualquier bebida de la barra.',       15, false, 2),
  ('Repostería del día',    'Acompañá tu café con algo dulce.',                        15, false, 3),
  ('Bolsa de grano 250g',   'Café de origen tostado en casa, molido a tu gusto.',      40, false, 4),
  ('Regalo de cumpleaños',  'Bebida y repostería gratis en tu mes de cumpleaños.',      5, true,  5),
  ('Preventa de nuevo lote','Acceso anticipado a cada nuevo lote antes que nadie.',    20, true,  6);
