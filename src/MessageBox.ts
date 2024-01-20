import { AccountUpdate, Bool, DeployArgs, Field, MerkleMap, MerkleMapWitness, MerkleTree, MerkleWitness, Permissions, Poseidon, Provable, PublicKey, Signature, SmartContract, State, UInt32, method, state } from "o1js";

export class MessageBox extends SmartContract {
    @state(PublicKey) admin = State<PublicKey>()
    @state(UInt32) countOfAddresses = State<UInt32>()
    @state(UInt32) countOfMessages = State<UInt32>()
    @state(Field) rootOfAddresses = State<Field>()
    @state(Field) rootOfMessages = State<Field>()

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
        super.init()
        AccountUpdate.createSigned(this.sender)

        const tree = new MerkleMap()

        this.admin.set(this.sender)
        this.countOfAddresses.set(UInt32.zero)
        this.countOfMessages.set(UInt32.zero)
        this.rootOfAddresses.set(tree.getRoot())
        this.rootOfMessages.set(tree.getRoot())
    }

    @method storeAddress(witneesOfAddress: MerkleMapWitness) {
        AccountUpdate.createSigned(this.sender)

        const admin = this.admin.getAndRequireEquals()
        const countOfAddresses = this.countOfAddresses.getAndRequireEquals()
        const rootOfAddresses = this.rootOfAddresses.getAndRequireEquals()

        const [computedRoot, addressToStore] = witneesOfAddress.computeRootAndKey(Field.empty())

        rootOfAddresses.assertEquals(computedRoot)
        admin.assertEquals(this.sender)
        countOfAddresses.assertLessThanOrEqual(UInt32.from(100))

        const [newRoot] = witneesOfAddress.computeRootAndKey(Field.empty())

        this.rootOfAddresses.set(newRoot)
        this.countOfAddresses.set(countOfAddresses.add(1))
    }

    @method depositMessage(witnessOfAddress: MerkleMapWitness, witnessOfMessages: MerkleMapWitness, message: Field) {
        AccountUpdate.createSigned(this.sender)

        const rootOfAddresses = this.rootOfAddresses.getAndRequireEquals()
        const countOfMessages = this.countOfMessages.getAndRequireEquals()

        const [computedRoot, addressToStore] = witnessOfAddress.computeRootAndKey(Field.empty())
        rootOfAddresses.assertEquals(computedRoot)

        const hashOfSender = Poseidon.hash(this.sender.toFields())
        addressToStore.assertEquals(hashOfSender)

        const msg = message.toBits()
        const flag1 = msg.at(-1)!
        const flag2 = msg.at(-2)!
        const flag3 = msg.at(-3)!
        const flag4 = msg.at(-4)!
        const flag5 = msg.at(-5)!
        const flag6 = msg.at(-6)!

        Provable.if(flag1, flag2.or(flag3).or(flag4).or(flag5).or(flag6), Bool(false)).assertFalse()

        Provable.if(flag2, flag3, Bool(true)).assertTrue()

        Provable.if(flag4, flag5.or(flag6), Bool(false)).assertFalse()

        this.emitEvent('MessageReceived', countOfMessages)

        this.countOfMessages.set(countOfMessages.add(1))
    }
}