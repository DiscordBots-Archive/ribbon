import { Argument, ArgumentType, CommandoClient, CommandoMessage } from 'awesome-commando';

export default class StringArrayType extends ArgumentType {
    constructor (client: CommandoClient) {
        super(client, 'stringarray');
    }

    public validate (value: string, msg: CommandoMessage, arg: Argument) {
        if (/([\S ]*,[\S ]*)*/i.test(value) && value.split(',').filter(Boolean).length >= 1) {
            return true;
        }

        return 'This command requires a command any word or set of words comma separated. For example `one` or `one,two,three`';
    }

    public parse (value: string) {
        return value.split(',').filter(Boolean);
    }
}