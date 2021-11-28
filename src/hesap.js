(r * (1 + k + b))();
const c =
  (item.creditRate / 100) * (1 + item.creditKkdf / 100 + item.creditBsmv / 100);

const t =
  (item.creditAmount *
    ((item.creditRate / 100) *
      (1 + item.creditKkdf / 100 + item.creditBsmv / 100))) /
  (1 -
    1 /
      Math.pow(
        1 +
          (item.creditRate / 100) *
            (1 + item.creditKkdf / 100 + item.creditBsmv / 100),
        12
      ));
