import { AccountUpdate, Bool, DeployArgs, Field, MerkleMap, MerkleMapWitness, MerkleTree, MerkleWitness, Permissions, Poseidon, Provable, PublicKey, Signature, SmartContract, State, UInt32, method, state } from "o1js";


export class MessageBox extends SmartContract {
    @state(PublicKey) admin = State<PublicKey>()
    @state(UInt32) addressCount = State<UInt32>()
    @state(UInt32) messageCount = State<UInt32>()
    @state(Field) addressesMapRoot = State<Field>()
    @state(Field) messagesMapRoot = State<Field>()

    events = {
        MessageReceived: UInt32
    }

    deploy(deployArgs?: DeployArgs) {
        super.deploy(deployArgs)
        this.account.permissions.set({
            ...Permissions.allImpossible(),
            access: Permissions.proof(),
            editState: Permissions.proof()
        })
    }

    init() {
        // calling `super.init` method
        super.init()

        // requiring that `this.sender` is one of the signers
        AccountUpdate.createSigned(this.sender)

        // creating an empty merkle map
        const tree = new MerkleMap()

        // setting states
        this.admin.set(this.sender)
        this.addressCount.set(UInt32.zero)
        this.messageCount.set(UInt32.zero)
        this.addressesMapRoot.set(tree.getRoot())
        this.messagesMapRoot.set(tree.getRoot())
    }

    @method storeAddress(addressWitness: MerkleMapWitness, address: PublicKey) {
        // requiring that `this.sender` is one of the signers
        AccountUpdate.createSigned(this.sender)

        // getting states
        const admin = this.admin.getAndRequireEquals()
        const addressCount = this.addressCount.getAndRequireEquals()
        const addressesMapRoot = this.addressesMapRoot.getAndRequireEquals()

        // hashing address
        const addressHash = Poseidon.hash(address.toFields())

        // computing root with an empty value
        const [computedAddressesMapRoot, computedAddressHash] = addressWitness.computeRootAndKey(Bool(false).toField())
        addressHash.assertEquals(computedAddressHash)

        // assertions
        addressesMapRoot.assertEquals(computedAddressesMapRoot)
        admin.assertEquals(this.sender)
        addressCount.assertLessThanOrEqual(UInt32.from(100))

        // computing root with a non-empty value
        const [newAddressesMapRoot] = addressWitness.computeRootAndKey(Bool(true).toField())

        // setting states
        this.addressesMapRoot.set(newAddressesMapRoot)
        this.addressCount.set(addressCount.add(1))
    }

    @method depositMessage(addressWitness: MerkleMapWitness, messageWitness: MerkleMapWitness, message: Field) {
        // requiring that `this.sender` is one of the signers
        AccountUpdate.createSigned(this.sender)

        // getting states
        const messageCount = this.messageCount.getAndRequireEquals()
        const addressesMapRoot = this.addressesMapRoot.getAndRequireEquals()
        const messagesMapRoot = this.messagesMapRoot.getAndRequireEquals()

        // hashing sender
        const senderHash = Poseidon.hash(this.sender.toFields())

        // requires that the user is eligible
        const [computedAddressesMapRoot, computedAddressHash] = addressWitness.computeRootAndKey(Bool(true).toField())
        senderHash.assertEquals(computedAddressHash)
        addressesMapRoot.assertEquals(computedAddressesMapRoot)

        // requires that the user didn't deposit a message yet
        const [computedMessagesMapRoot, computedDepositorHash] = messageWitness.computeRootAndKey(Bool(false).toField())
        computedDepositorHash.assertEquals(senderHash)
        computedMessagesMapRoot.assertEquals(messagesMapRoot)

        // checking message flags
        const msg = message.toBits()
        const flag1 = msg[249]
        const flag2 = msg[250]
        const flag3 = msg[251]
        const flag4 = msg[252]
        const flag5 = msg[253]
        const flag6 = msg[254]
        Provable.if(flag1, flag2.or(flag3).or(flag4).or(flag5).or(flag6), Bool(false)).assertFalse()
        Provable.if(flag2, flag3, Bool(true)).assertTrue()
        Provable.if(flag4, flag5.or(flag6), Bool(false)).assertFalse()

        // emitting an event
        this.emitEvent('MessageReceived', messageCount)

        // computing root with the message
        const [newMessagesMapRoot] = messageWitness.computeRootAndKey(message)

        // setting states
        this.messagesMapRoot.set(newMessagesMapRoot)
        this.messageCount.set(messageCount.add(1))
    }

    @method checkMessage(messageWitness: MerkleMapWitness, depositor: PublicKey, message: Field): Bool {
        // getting state
        const messagesMapRoot = this.messagesMapRoot.getAndRequireEquals()

        // hashing depositor
        const depositorHash = Poseidon.hash(depositor.toFields())

        // computing root and key
        const [computedMessagesMapRoot, computedDepositorHash] = messageWitness.computeRootAndKey(message)

        // returning if given depositor has deposited given message
        return messagesMapRoot.equals(computedMessagesMapRoot)
            .and(depositorHash.equals(computedDepositorHash))
    }
}