import { Model, Meta } from 'nautil'

class ShopName extends Meta {
  static default = 'shop name'
  static type = String
}

class ShopDescription extends Meta {
  static default = 'shop description'
  static type = String
}

class ShopModel extends Model {
  static shop_name = ShopName
  static shop_description = ShopDescription
}

export class HomeModel extends Model {
  static shop = ShopModel
}
